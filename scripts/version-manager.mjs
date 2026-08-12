#!/usr/bin/env node
/**
 * version-manager.mjs — Version management script for ZMusic
 *
 * Reads the current version from package.json, bumps the requested version
 * component (major/minor/patch), updates package.json and the BUILD_VERSION
 * fallback string in src/App.jsx, then creates a git commit and pushes to
 * origin master.
 *
 * Usage:
 *   node scripts/version-manager.mjs [major|minor|patch] "commit message"
 *
 * Examples:
 *   node scripts/version-manager.mjs patch "Fixed mobile copy button"
 *   node scripts/version-manager.mjs minor "Added social media generator"
 *   node scripts/version-manager.mjs major "Breaking API redesign"
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const PACKAGE_FILE = path.join(ROOT, 'package.json');
const APP_JSX_FILE = path.join(ROOT, 'src', 'App.jsx');

const GIT_USER_EMAIL = 'zwindhuang@qq.com';
const GIT_USER_NAME = 'Zwind Huang';

/** Read and parse package.json */
function readPackage() {
  return JSON.parse(fs.readFileSync(PACKAGE_FILE, 'utf-8'));
}

/** Write package.json with pretty-printing */
function writePackage(pkg) {
  fs.writeFileSync(PACKAGE_FILE, JSON.stringify(pkg, null, 2) + '\n');
}

/** Bump a semver string (e.g. "7.2.0") by the given type */
function bumpSemver(version, type) {
  const parts = version.split('.').map(Number);
  let [major, minor, patch] = parts;
  switch (type) {
    case 'major':
      major += 1;
      minor = 0;
      patch = 0;
      break;
    case 'minor':
      minor += 1;
      patch = 0;
      break;
    case 'patch':
      patch += 1;
      break;
    default:
      throw new Error(`Invalid bump type: "${type}". Use: major, minor, patch`);
  }
  return `${major}.${minor}.${patch}`;
}

/**
 * Update the BUILD_VERSION fallback string in src/App.jsx.
 * Targets the line:
 *   const BUILD_VERSION = (typeof __APP_VERSION__ !== 'undefined') ? __APP_VERSION__ : '7.2.0';
 * and replaces the quoted version after `__APP_VERSION__ :`.
 */
function updateAppJsxVersion(newVersion) {
  const content = fs.readFileSync(APP_JSX_FILE, 'utf-8');
  // Match: __APP_VERSION__ : 'X.Y.Z'  (the ternary fallback only)
  const pattern = /(__APP_VERSION__\s*:\s*)'([^']+)'/;
  const match = content.match(pattern);
  if (!match) {
    throw new Error(`Could not find BUILD_VERSION fallback string in ${APP_JSX_FILE}`);
  }
  const updated = content.replace(pattern, `$1'${newVersion}'`);
  fs.writeFileSync(APP_JSX_FILE, updated);
}

/** Run a git command in the repo root, inheriting stdio */
function git(cmd) {
  return execSync(`git ${cmd}`, { cwd: ROOT, stdio: 'inherit', encoding: 'utf-8' });
}

/** Ensure the local git user is configured for this repo */
function ensureGitUser() {
  try {
    execSync(`git config user.email "${GIT_USER_EMAIL}"`, { cwd: ROOT, stdio: 'ignore' });
    execSync(`git config user.name "${GIT_USER_NAME}"`, { cwd: ROOT, stdio: 'ignore' });
  } catch {
    // non-fatal: global config may already be correct
  }
}

/** Commit using a temp file to avoid shell-quoting issues with the message */
function commitWithMessage(message) {
  const tmpFile = path.join(ROOT, '.git', 'VM_COMMIT_MSG');
  fs.writeFileSync(tmpFile, message);
  try {
    git(`commit -F "${tmpFile}"`);
  } finally {
    if (fs.existsSync(tmpFile)) {
      try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
    }
  }
}

/** Print usage help */
function showHelp() {
  console.log(`
ZMusic Version Manager
======================

Bumps the project version, updates package.json and src/App.jsx, then commits
and pushes to origin master.

Usage:
  node scripts/version-manager.mjs [major|minor|patch] "commit message"

Bump types:
  major    Breaking change (e.g. 7.2.0 -> 8.0.0)
  minor    New feature      (e.g. 7.2.0 -> 7.3.0)
  patch    Bug fix          (e.g. 7.2.0 -> 7.2.1)

Examples:
  node scripts/version-manager.mjs patch "Fixed mobile copy button"
  node scripts/version-manager.mjs minor "Added social media generator"
`);
}

function main() {
  const args = process.argv.slice(2);
  const type = args[0];
  const message = args.slice(1).join(' ').trim();

  if (!type || !['major', 'minor', 'patch'].includes(type)) {
    showHelp();
    process.exit(type ? 1 : 0);
  }

  if (!message) {
    console.error('Error: a commit message is required.');
    console.error('Usage: node scripts/version-manager.mjs [major|minor|patch] "commit message"');
    process.exit(1);
  }

  // 0. Read current version
  const pkg = readPackage();
  const currentVersion = pkg.version;
  const newVersion = bumpSemver(currentVersion, type);

  console.log(`\n=== ZMusic Version Manager ===`);
  console.log(`Bump type:   ${type}`);
  console.log(`Current:     v${currentVersion}`);
  console.log(`New:         v${newVersion}`);
  console.log(`Message:     ${message}`);

  // 1. Update package.json
  pkg.version = newVersion;
  writePackage(pkg);
  console.log(`\n[1/4] Updated package.json -> v${newVersion}`);

  // 2. Update src/App.jsx BUILD_VERSION fallback
  updateAppJsxVersion(newVersion);
  console.log(`[2/4] Updated src/App.jsx BUILD_VERSION fallback -> v${newVersion}`);

  // 3. Configure git user + stage all changes
  ensureGitUser();
  git('add -A');
  console.log(`[3/4] Staged changes`);

  // 4. Commit and push
  const commitMessage = `V${newVersion}: ${message}`;
  commitWithMessage(commitMessage);
  console.log(`[4/4] Committed: "${commitMessage}"`);

  console.log(`\nPushing to origin master...`);
  try {
    git('push origin master');
    console.log(`\n=== SUCCESS ===`);
    console.log(`  Version:  v${newVersion}`);
    console.log(`  Commit:   ${commitMessage}`);
    console.log(`  Pushed:   origin/master`);
  } catch (err) {
    console.error(`\n=== PUSH FAILED ===`);
    console.error(`  Commit is local. Re-run push when online.`);
    console.error(`  Error: ${err.message}`);
    process.exit(1);
  }
}

main();
