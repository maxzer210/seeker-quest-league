#!/usr/bin/env node
/**
 * Publish the current release APK to the Solana Mobile dApp Store.
 *
 * Why this exists instead of calling the CLI straight from PowerShell:
 * the release notes are multi-line and full of emoji, and PowerShell 5.1
 * mangles native-command arguments badly enough that the CLI stopped seeing
 * `--keypair` at all. Spawning with an explicit argv array hands the strings
 * to the process untouched — no shell, no quoting rules, no surprises.
 *
 * The portal API key is read from the environment and is never printed,
 * logged, or written anywhere by this script.
 *
 *   $env:DAPP_STORE_API_KEY = "<key>"
 *   node dapp-store/publish.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const APK = path.join(ROOT, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
const KEYPAIR = path.join(ROOT, 'dapp-store', 'publisher.json');
const NOTES = path.join(ROOT, 'dapp-store', 'release-notes.txt');
const CLI = path.join(ROOT, 'node_modules', '@solana-mobile', 'dapp-store-cli', 'bin', 'dapp-store.js');

const dryRun = process.argv.includes('--dry-run');

const ok = (m) => console.log(`ok    ${m}`);
const fail = (m) => { console.error(`FAIL  ${m}`); process.exit(1); };

for (const [label, p] of [['APK', APK], ['publisher keypair', KEYPAIR], ['release notes', NOTES], ['CLI', CLI]]) {
  if (!fs.existsSync(p)) fail(`${label} not found at ${p}`);
}
ok(`APK present (${(fs.statSync(APK).size / 1024 / 1024).toFixed(1)} MB)`);
ok('publisher keypair present');
ok('CLI present');

const whatsNew = fs.readFileSync(NOTES, 'utf8').trim();
if (!whatsNew) fail('release notes are empty');
ok(`release notes (${whatsNew.length} chars)`);

if (!process.env.DAPP_STORE_API_KEY || !process.env.DAPP_STORE_API_KEY.trim()) {
  console.error('\nDAPP_STORE_API_KEY is not set in this shell.');
  console.error('Get it from portal.solanamobile.com -> Developer -> API keys, then:\n');
  console.error('  $env:DAPP_STORE_API_KEY = "<your key>"\n');
  process.exit(1);
}
ok(`API key found in environment (length ${process.env.DAPP_STORE_API_KEY.length}, value not shown)`);

console.log('\n--- what players will see ---');
console.log(whatsNew);
console.log('-----------------------------\n');

if (dryRun) { console.log('dry run - nothing submitted'); process.exit(0); }

// Derived from the APK, so retrying after a dropped upload is treated as the
// same publication rather than a second one; a genuinely new build gets a new key.
const hash = crypto.createHash('sha256').update(fs.readFileSync(APK)).digest('hex').slice(0, 32);

const args = [
  CLI,
  '--apk-file', APK,
  '--whats-new', whatsNew,
  '--keypair', KEYPAIR,
  '--idempotency-key', hash,
  '--verbose',
];

console.log(`submitting (idempotency key ${hash})...\n`);

const child = spawn(process.execPath, args, { stdio: 'inherit', cwd: ROOT });

child.on('close', (code) => {
  if (code === 0) {
    console.log('\nSUBMITTED. Track review status at portal.solanamobile.com');
  } else {
    console.log(`\nSubmission exited with code ${code}.`);
    console.log('If the upload dropped mid-flight, resume with the release id printed above:');
    console.log('  node node_modules/@solana-mobile/dapp-store-cli/bin/dapp-store.js resume --release-id <id>');
  }
  process.exit(code ?? 1);
});
