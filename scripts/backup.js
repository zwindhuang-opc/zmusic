#!/usr/bin/env node
/**
 * backup.js — Git backup & tag script for ZMusic
 *
 * Reads VERSION.json for the current version, creates a git commit with
 * a version message, creates a git tag (e.g., v1.0.0), and outputs
 * the git push commands for pushing to github.com/zwindhuang@qq.com.
 *
 * Usage:
 *   node scripts/backup.js [optional message]
 *
 * @module scripts/backup
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const VERSION_FILE = path.join(ROOT, 'VERSION.json');
const REMOTE_URL = 'github.com/zwindhuang@qq.com';

/**
 * Read and parse VERSION.json.
 * @returns {object} Parsed version object
 */
function readVersion() {
  return JSON.parse(fs.readFileSync(VERSION_FILE, 'utf-8'));
}

/**
 * Execute a git command in the project root.
 * @param {string} cmd - Git command arguments (without "git")
 * @returns {string} Command stdout
 */
function git(cmd) {
  return execSync(`git ${cmd}`, { cwd: ROOT, encoding: 'utf-8', stdio: 'pipe' }).trim();
}

/**
 * Get the current git branch name.
 * @returns {string} Branch name
 */
function getCurrentBranch() {
  try {
    return git('rev-parse --abbrev-ref HEAD');
  } catch {
    return 'main';
  }
}

/**
 * Check if a git remote "origin" exists.
 * @returns {boolean}
 */
function hasRemote() {
  try {
    git('remote get-url origin');
    return true;
  } catch {
    return false;
  }
}

/**
 * Initialize git remote if missing, pointing to the ZMusic GitHub repo.
 */
function ensureRemote() {
  if (!hasRemote()) {
    console.log('No git remote "origin" found. Adding...');
    try {
      git(`remote add origin ${REMOTE_URL}:zmusic.git`);
      console.log(`Remote "origin" added → ${REMOTE_URL}:zmusic.git`);
    } catch (e) {
      console.warn('Could not add remote. Skipping remote setup.');
    }
  }
}

/**
 * Stage all changes and commit with a version-aware message.
 * @param {object} ver - Version object
 * @param {string} [extraMessage] - Optional extra notes for the commit body
 * @returns {string} The commit message used
 */
function commitAll(ver, extraMessage) {
  const tag = `v${ver.version}`;
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

  const message = `Release ${tag} (backup)\n\nVersion: ${ver.version}\nDate: ${timestamp}\n${extraMessage || ''}`.trim();

  git('add -A');
  console.log('Staged all changes.');

  const escapedMsg = message.replace(/"/g, '\\"').replace(/\n/g, '\\n');
  git(`commit -m "${escapedMsg}"`);
  console.log(`Committed as ${tag}`);

  return tag;
}

/**
 * Create an annotated git tag for the current version.
 * @param {string} tag - Tag name (e.g. "v1.0.0")
 */
function createTag(tag) {
  const ver = readVersion();
  const tagMsg = `Release ${tag}\n\nVersion: ${ver.version}\nDate: ${ver.releaseDate}`;
  const msgFile = path.join(ROOT, '.git', 'BACKUP_TAG_MSG');
  fs.writeFileSync(msgFile, tagMsg);

  try {
    git(`tag -a ${tag} -F .git/BACKUP_TAG_MSG`);
    console.log(`Created tag: ${tag}`);
  } finally {
    try { fs.unlinkSync(msgFile); } catch { /* noop */ }
  }
}

/**
 * Main entry point: read version, commit, tag, output push commands.
 */
function main() {
  const ver = readVersion();
  const tag = `v${ver.version}`;
  const extraMsg = process.argv.slice(2).join(' ');

  console.log(`\nZMusic GitHub Backup`);
  console.log(`===================`);
  console.log(`Version:  ${tag}`);
  console.log(`Branch:   ${getCurrentBranch()}`);
  console.log(`Remote:   ${REMOTE_URL}`);

  ensureRemote();

  try {
    const commitTag = commitAll(ver, extraMsg);
    createTag(commitTag);

    const branch = getCurrentBranch();

    console.log(`\n✅ Backup completed locally!`);
    console.log(`\n🚀 Push commands to ${REMOTE_URL}:`);
    console.log(`   git push origin ${branch}`);
    console.log(`   git push origin ${tag}`);
    console.log(`\n📦 Full push (all branches + tags):`);
    console.log(`   git push origin --all`);
    console.log(`   git push origin --tags`);
  } catch (err) {
    console.error(`\n❌ Backup failed: ${err.message}`);
    console.error('Make sure you are inside a git repository and have no uncommitted changes.');
    process.exit(1);
  }
}

main();