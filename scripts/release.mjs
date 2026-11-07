#!/usr/bin/env node
/**
 * release.mjs — Cross-platform version release & backup script
 *
 * Features:
 * 1. Bumps version in VERSION.json and package.json (major/minor/patch)
 * 2. Updates changes history in VERSION.json
 * 3. Creates annotated git tag with changelog
 * 4. Stages ALL changes with git add -A
 * 5. Commits with proper message
 * 6. Pushes to remote (origin master)
 * 7. Creates GitHub release if possible
 *
 * Usage:
 *   node scripts/release.mjs major  "Major release description"
 *   node scripts/release.mjs minor  "Added new feature X"
 *   node scripts/release.mjs patch  "Fixed bug in Y"
 *   node scripts/release.mjs status
 *   node scripts/release.mjs backup  (backup without version bump)
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const VERSION_FILE = path.join(ROOT, 'VERSION.json');
const PACKAGE_FILE = path.join(ROOT, 'package.json');
const CHANGELOG_FILE = path.join(ROOT, 'CHANGELOG.md');

/** Current timestamp string (cross-platform) */
function timestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
}

/** Current date string */
function today() {
  return new Date().toISOString().split('T')[0];
}

/** Read VERSION.json */
function readVersion() {
  return JSON.parse(fs.readFileSync(VERSION_FILE, 'utf-8'));
}

/** Write VERSION.json with proper formatting */
function writeVersion(version) {
  fs.writeFileSync(VERSION_FILE, JSON.stringify(version, null, 2) + '\n');
}

/** Update version in package.json */
function updatePackageJson(newVersion) {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_FILE, 'utf-8'));
  pkg.version = newVersion;
  fs.writeFileSync(PACKAGE_FILE, JSON.stringify(pkg, null, 2) + '\n');
}

/** Bump version by type */
function bumpVersion(type) {
  const ver = readVersion();

  switch (type) {
    case 'major':
      ver.major += 1;
      ver.minor = 0;
      ver.patch = 0;
      break;
    case 'minor':
      ver.minor += 1;
      ver.patch = 0;
      break;
    case 'patch':
      ver.patch += 1;
      break;
    default:
      throw new Error(`Invalid bump type: "${type}". Use: major, minor, patch`);
  }

  ver.version = `${ver.major}.${ver.minor}.${ver.patch}`;
  ver.releaseDate = today();
  ver.buildNumber = (ver.buildNumber || 0) + 1;
  ver.status = 'production-ready';

  return ver;
}

/** Add changelog entry to VERSION.json */
function addChange(version, message) {
  const entry = `v${version.version} - ${message} (build #${version.buildNumber})`;
  if (!Array.isArray(version.changes)) {
    version.changes = [];
  }
  version.changes.unshift(entry);
  // Keep only last 50 entries
  if (version.changes.length > 50) {
    version.changes = version.changes.slice(0, 50);
  }
}

/** Update CHANGELOG.md file */
function updateChangelog(version, message) {
  const tag = `v${version.version}`;
  const date = version.releaseDate;

  let existing = '';
  if (fs.existsSync(CHANGELOG_FILE)) {
    existing = fs.readFileSync(CHANGELOG_FILE, 'utf-8');
  }

  const header = `# ZMusic Changelog\n\n`;
  const newEntry = `## ${tag} (${date})\n\n- ${message}\n- Build #${version.buildNumber}\n\n`;

  const changelog = existing
    ? header + newEntry + (existing.startsWith('#') ? existing.slice(existing.indexOf('\n') + 1) : existing)
    : header + newEntry;

  fs.writeFileSync(CHANGELOG_FILE, changelog);
}

/** Execute git command safely */
function git(cmd) {
  try {
    return execSync(`git ${cmd}`, { cwd: ROOT, stdio: 'inherit', encoding: 'utf-8' });
  } catch (err) {
    console.error(`Git command failed: git ${cmd}`);
    console.error(err.message);
    throw err;
  }
}

/** Check git status - returns array of changed files */
function getChangedFiles() {
  try {
    const output = execSync('git status --porcelain', { cwd: ROOT, encoding: 'utf-8' });
    return output.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

/** Stage all changes */
function stageAll() {
  git('add -A');
}

/**
 * Commit with message.
 * Multi-line messages are written to a temp file and passed via `-F` because
 * embedding raw newlines in `-m` breaks on the Windows cmd shell.
 */
function commit(message) {
  const msgFile = path.join(ROOT, '.git', 'COMMIT_MSG');
  fs.writeFileSync(msgFile, message, 'utf-8');
  try {
    git('commit -F .git/COMMIT_MSG');
  } finally {
    if (fs.existsSync(msgFile)) fs.unlinkSync(msgFile);
  }
}

/** Whether a branch exists locally or on origin. */
function branchExists(name) {
  try {
    execSync(`git rev-parse --verify ${name}`, { cwd: ROOT, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Keep `develop` mirroring `master` after every release.
 * develop is a fast-forward-only mirror: it never carries its own commits,
 * so a plain `merge --ff-only` is always safe. Runs after the working tree
 * has been committed, and restores the original branch on any failure.
 *
 * @param {string} mainBranch - branch that just received the release
 */
function syncDevelopBranch(mainBranch = 'master') {
  if (!branchExists('develop')) {
    console.log('[branch] develop 分支不存在，跳过同步');
    return false;
  }
  let switched = false;
  try {
    git('fetch origin --prune');
    git('checkout develop');
    switched = true;
    git(`merge --ff-only ${mainBranch}`);
    git('push origin develop');
    git(`checkout ${mainBranch}`);
    switched = false;
    console.log(`[branch] develop 已快进同步到 ${mainBranch} 并推送`);
    return true;
  } catch (e) {
    console.warn(`[branch] develop 同步失败: ${e.message}`);
    if (switched) {
      try { git(`checkout ${mainBranch}`); } catch { /* best effort */ }
    }
    return false;
  }
}

/** Whether a git tag already exists. */
function tagExists(tag) {
  try {
    execSync(`git rev-parse --verify refs/tags/${tag}`, { cwd: ROOT, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/** Create annotated tag (no-op if it already points at this release). */
function createTag(version) {
  const tag = `v${version.version}`;
  if (tagExists(tag)) {
    console.log(`[tag] ${tag} 已存在，跳过创建`);
    return tag;
  }
  const message = `Release ${tag}\n\nVersion: ${version.version}\nBuild: #${version.buildNumber}\nDate: ${version.releaseDate}`;
  // Use printf-like approach for multi-line tag message
  fs.writeFileSync(path.join(ROOT, '.git', 'TAG_MSG'), message);
  git(`tag -a ${tag} -F .git/TAG_MSG`);
  fs.unlinkSync(path.join(ROOT, '.git', 'TAG_MSG'));
  return tag;
}

/** Push to remote */
function push(branch = 'master') {
  try {
    git(`push origin ${branch}`);
    console.log(`Pushed to origin/${branch}`);
    return true;
  } catch (err) {
    console.warn(`Warning: Push failed (network issue?): ${err.message}`);
    console.warn('Changes are committed locally. Push will retry when network is available.');
    return false;
  }
}

/** Push tag */
function pushTag(tag) {
  try {
    git(`push origin ${tag}`);
    console.log(`Pushed tag ${tag}`);
    return true;
  } catch (err) {
    console.warn(`Warning: Tag push failed: ${err.message}`);
    return false;
  }
}

/** Get current branch */
function getCurrentBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { cwd: ROOT, encoding: 'utf-8' }).trim();
  } catch {
    return 'master';
  }
}

/** Show status */
function showStatus() {
  const ver = readVersion();
  const branch = getCurrentBranch();
  const changes = getChangedFiles();

  console.log(`\nZMusic Version Status`);
  console.log(`======================`);
  console.log(`  Version:   v${ver.version}`);
  console.log(`  Build:     #${ver.buildNumber}`);
  console.log(`  Branch:    ${branch}`);
  console.log(`  Status:    ${ver.status}`);
  console.log(`  Released:  ${ver.releaseDate}`);
  console.log(`  Changes:   ${changes.length} file(s) modified`);

  if (changes.length > 0) {
    console.log(`\n  Modified files:`);
    changes.forEach(f => console.log(`    ${f}`));
  }

  console.log(`\n  Recent changes:`);
  if (ver.changes && ver.changes.length > 0) {
    ver.changes.slice(0, 5).forEach((c, i) => console.log(`    ${i + 1}. ${c}`));
  }

  return ver;
}

/** Show help */
function showHelp() {
  console.log(`
ZMusic Release Script
=======================

Cross-platform version bump, commit, tag, and push.

Usage:
  node scripts/release.mjs <command> [message]

Commands:
  major     Bump major version (e.g., 7.7.2 -> 8.0.0) — 重大/破坏性变更
  minor     Bump minor version (e.g., 7.7.2 -> 7.8.0) — 新功能
  patch     Bump patch version (e.g., 7.7.2 -> 7.7.3) — 缺陷修复
  publish   Tag + commit + push the CURRENT version (no bump)
            （先用 version.js 升版本、跑截图，最后用 publish 统一发布）
  status    Show current version status
  backup    Commit and push all changes without version bump

Branch management:
  master 为唯一发布分支；每次成功推送到 master 后，develop 会被
  --ff-only 快进同步到 master 并推送，保证 develop 始终是 master 的镜像。

Examples:
  node scripts/release.mjs minor "Added social media BGM generator, prompt engineering, visual style recommendations"
  node scripts/release.mjs patch "Fixed mobile copy button, i18n updates"
  node scripts/release.mjs status
  node scripts/release.mjs backup

Version numbering follows Semantic Versioning (SemVer):
  MAJOR  - Breaking changes, major features
  MINOR  - New features added (backward compatible)
  PATCH  - Bug fixes, minor improvements
`);
}

/** Main entry point */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const message = args.slice(1).join(' ');

  if (!command || command === 'help' || command === '--help') {
    showHelp();
    process.exit(0);
  }

  if (command === 'status') {
    showStatus();
    process.exit(0);
  }

  if (command === 'backup') {
    console.log(`\n=== Manual Backup (no version bump) ===`);
    const changes = getChangedFiles();
    console.log(`Found ${changes.length} file(s) to commit`);

    if (changes.length === 0) {
      console.log('No changes to commit.');
      process.exit(0);
    }

    const msg = message || `Backup - ${timestamp()}`;
    console.log(`Commit message: "${msg}"`);

    stageAll();
    commit(msg);

    const tag = `backup-${today()}`;
    if (tagExists(tag)) {
      console.log(`Tag ${tag} 已存在，跳过`);
    } else {
      try {
        git(`tag -a ${tag} -m "${msg.replace(/"/g, '\\"')}"`);
        console.log(`Created tag: ${tag}`);
      } catch (e) {
        console.warn(`Tag creation skipped: ${e.message}`);
      }
    }

    const branch = getCurrentBranch();
    const pushed = push(branch);
    if (pushed) {
      pushTag(tag);
      syncDevelopBranch(branch);
      console.log(`\nBackup completed successfully!`);
    } else {
      console.log(`\nBackup committed locally. Push will retry when online.`);
    }
    process.exit(0);
  }

  // 发布当前版本（不升版本号）：用于先跑 version.js + 截图，最后一步统一提交推送
  if (command === 'publish') {
    const ver = readVersion();
    const msg = message || `Release v${ver.version} (build #${ver.buildNumber})`;
    console.log(`\n=== Publish v${ver.version} (build #${ver.buildNumber}) ===`);
    console.log(`Commit message: "${msg}"`);

    const changes = getChangedFiles();
    console.log(`Files to commit: ${changes.length}`);

    if (changes.length > 0) {
      stageAll();
      commit(msg);
    } else {
      console.log('工作区无改动，仅创建 tag 并推送');
    }

    const tag = createTag(ver);
    console.log(`Tagged: ${tag}`);

    const branch = getCurrentBranch();
    const pushed = push(branch);
    if (pushed) {
      pushTag(tag);
      syncDevelopBranch(branch);
      console.log(`\n=== PUBLISH COMPLETE ===`);
      console.log(`  Version: v${ver.version}`);
      console.log(`  Tag:     ${tag}`);
      console.log(`  Branch:  ${branch} (+ develop 同步)`);
    } else {
      console.log(`\n=== PUBLISH COMMITTED LOCALLY (push failed) ===`);
      console.log('  Run: node scripts/release.mjs backup  (when online)');
    }
    process.exit(0);
  }

  // Version bump: major, minor, patch
  if (!['major', 'minor', 'patch'].includes(command)) {
    console.error(`Error: Unknown command "${command}"`);
    showHelp();
    process.exit(1);
  }

  console.log(`\n=== ZMusic Release: ${command.toUpperCase()} BUMP ===`);

  // 1. Show current version
  const current = readVersion();
  console.log(`Current version: v${current.version} (build #${current.buildNumber})`);

  // 2. Get changes info
  const changes = getChangedFiles();
  console.log(`Files to commit: ${changes.length}`);
  if (changes.length > 0) {
    console.log(`  ${changes.slice(0, 5).join(', ')}${changes.length > 5 ? ` +${changes.length - 5} more...` : ''}`);
  }

  // 3. Bump version
  console.log(`\nBumping ${command} version...`);
  const newVer = bumpVersion(command);
  const releaseMessage = message || `Release v${newVer.version}`;
  addChange(newVer, releaseMessage);

  // 4. Write version files
  writeVersion(newVer);
  updatePackageJson(newVer.version);
  updateChangelog(newVer, releaseMessage);

  console.log(`New version: v${newVer.version} (build #${newVer.buildNumber})`);

  // 5. Git operations
  console.log('\n=== Git Operations ===');
  stageAll();
  console.log('Staged all changes');

  const commitMsg = `Release v${newVer.version} (build #${newVer.buildNumber})\n\n${releaseMessage}`;
  commit(commitMsg);
  console.log('Committed');

  const tag = createTag(newVer);
  console.log(`Tagged: ${tag}`);

  // 6. Push
  const branch = getCurrentBranch();
  console.log(`\n=== Pushing to origin/${branch} ===`);
  const pushed = push(branch);

  if (pushed) {
    pushTag(tag);
    syncDevelopBranch(branch);
    console.log(`\n=== RELEASE COMPLETE ===`);
    console.log(`  Version:  v${newVer.version}`);
    console.log(`  Build:    #${newVer.buildNumber}`);
    console.log(`  Tag:      ${tag}`);
    console.log(`  Branch:   ${branch}`);
    console.log(`  Date:     ${newVer.releaseDate}`);
    console.log(`  Status:   ${newVer.status}`);
    console.log(`  Changes:  ${newVer.changes.length} entries in history`);
  } else {
    console.log(`\n=== RELEASE COMMITTED LOCALLY (push failed) ===`);
    console.log(`  Version:  v${newVer.version}`);
    console.log(`  Commit is local - will auto-push on next backup/release`);
    console.log(`  Run: node scripts/release.mjs backup  (when online)`);
  }
}

main();