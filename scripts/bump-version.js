#!/usr/bin/env node
/**
 * Bump APP_VERSION patch and stamp BUILD_TIME.
 * Usage: node scripts/bump-version.js [major|minor|patch] [build-code]
 *
 *   node scripts/bump-version.js               → patch bump
 *   node scripts/bump-version.js minor          → minor bump
 *   node scripts/bump-version.js patch "fix-tap"→ patch bump + build code
 */

const fs   = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'lib', 'version.ts');

const src = fs.readFileSync(FILE, 'utf8');

const verMatch = src.match(/APP_VERSION\s*=\s*'(\d+)\.(\d+)\.(\d+)'/);
if (!verMatch) {
  console.error('[bump] APP_VERSION not found in', FILE);
  process.exit(1);
}
let [, maj, min, pat] = verMatch.map(Number);
if (typeof maj === 'string') maj = Number(maj);

const kind = (process.argv[2] || 'patch').toLowerCase();
const code = process.argv[3] || null;

if (kind === 'major') { maj += 1; min = 0; pat = 0; }
else if (kind === 'minor') { min += 1; pat = 0; }
else { pat += 1; }

const ver = `${maj}.${min}.${pat}`;

// Time stamp YYYY-MM-DD HH:MM в локальной TZ
const d  = new Date();
const pad = (n) => String(n).padStart(2, '0');
const ts = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

let next = src
  .replace(/APP_VERSION\s*=\s*'[^']*'/, `APP_VERSION = '${ver}'`)
  .replace(/BUILD_TIME\s*=\s*'[^']*'/,  `BUILD_TIME  = '${ts}'`);

if (code) {
  next = next.replace(/BUILD_CODE\s*=\s*'[^']*'/, `BUILD_CODE  = '${code}'`);
}

fs.writeFileSync(FILE, next, 'utf8');

console.log(`[bump] ${ver} · ${ts}${code ? ` · ${code}` : ''}`);
