#!/usr/bin/env node
/**
 * Validate the current release assets before uploading them through the
 * Solana Mobile Publisher Portal.
 *
 * Publishing is intentionally completed in the authenticated web portal. This
 * helper does not read a publisher keypair or API key and cannot submit.
 *
 *   node dapp-store/publish.js
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const APK = path.join(ROOT, 'dapp-store', 'media', 'app-release.apk');
const NOTES = path.join(ROOT, 'dapp-store', 'release-notes.txt');
const EXPECTED_PACKAGE = 'com.seekerquest.league';
const MIN_APK_BYTES = 1024 * 1024;

const ok = (m) => console.log(`ok    ${m}`);
const fail = (m) => { console.error(`FAIL  ${m}`); process.exit(1); };

for (const [label, p] of [['APK', APK], ['release notes', NOTES]]) {
  if (!fs.existsSync(p)) fail(`${label} not found at ${p}`);
}

const apkSize = fs.statSync(APK).size;
if (apkSize < MIN_APK_BYTES) fail(`APK is too small (${apkSize} bytes)`);
const magic = Buffer.alloc(2);
const apkFd = fs.openSync(APK, 'r');
fs.readSync(apkFd, magic, 0, 2, 0);
fs.closeSync(apkFd);
if (magic.toString('ascii') !== 'PK') fail('APK is not a ZIP/APK archive');
ok(`APK archive present (${(apkSize / 1024 / 1024).toFixed(1)} MB)`);

const whatsNew = fs.readFileSync(NOTES, 'utf8').trim();
if (!whatsNew) fail('release notes are empty');
ok(`release notes (${whatsNew.length} chars)`);

function findBuildTool(name) {
  const sdkRoot = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (!sdkRoot) fail('ANDROID_HOME or ANDROID_SDK_ROOT is not set');
  const buildTools = path.join(sdkRoot, 'build-tools');
  if (!fs.existsSync(buildTools)) fail(`Android build-tools not found at ${buildTools}`);
  const versions = fs.readdirSync(buildTools, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  for (const version of versions) {
    const candidate = path.join(buildTools, version, name);
    if (fs.existsSync(candidate)) return candidate;
  }
  fail(`${name} not found under ${buildTools}`);
}

function run(tool, args, label) {
  const result = spawnSync(tool, args, { cwd: ROOT, encoding: 'utf8', shell: false });
  if (result.error) fail(`${label}: ${result.error.message}`);
  if (result.status !== 0) {
    const details = `${result.stdout || ''}\n${result.stderr || ''}`.trim();
    fail(`${label}${details ? `: ${details}` : ''}`);
  }
  return `${result.stdout || ''}\n${result.stderr || ''}`;
}

const apksigner = findBuildTool(process.platform === 'win32' ? 'apksigner.bat' : 'apksigner');
run(apksigner, ['verify', '--verbose', '--print-certs', APK], 'APK signature verification failed');
ok('APK signature verified');

const aapt2 = findBuildTool(process.platform === 'win32' ? 'aapt2.exe' : 'aapt2');
const manifest = run(aapt2, ['dump', 'badging', APK], 'APK manifest inspection failed');
const packageMatch = manifest.match(/package:\s+name='([^']+)'/);
if (!packageMatch) fail('APK package name was not found');
if (packageMatch[1] !== EXPECTED_PACKAGE) {
  fail(`unexpected package ${packageMatch[1]} (expected ${EXPECTED_PACKAGE})`);
}
ok(`package id ${EXPECTED_PACKAGE}`);

console.log('\n--- what players will see ---');
console.log(whatsNew);
console.log('-----------------------------\n');
console.log('READY. Upload dapp-store/media/app-release.apk and dapp-store/release-notes.txt through https://portal.solanamobile.com');
