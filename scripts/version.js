#!/usr/bin/env node
/**
 * version.js — Comprehensive semantic version bumping for ZMusic
 *
 * Updates VERSION.json, package.json, src/App.jsx BUILD_VERSION fallback,
 * and android/app/build.gradle versionCode/versionName.
 *
 * Usage:
 *   node scripts/version.js [major|minor|patch] ["changelog message"]
 *
 * Examples:
 *   node scripts/version.js patch "Fixed auth guard redirect"
 *   node scripts/version.js minor "Added phone SMS registration flow"
 *   node scripts/version.js major "Breaking API redesign"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const VERSION_FILE = path.join(ROOT, 'VERSION.json');
const PACKAGE_FILE = path.join(ROOT, 'package.json');
const APP_JSX_FILE = path.join(ROOT, 'src', 'App.jsx');
const ANDROID_GRADLE_FILE = path.join(ROOT, 'android', 'app', 'build.gradle');

function readVersion() {
  return JSON.parse(fs.readFileSync(VERSION_FILE, 'utf-8'));
}

function writeVersion(version) {
  fs.writeFileSync(VERSION_FILE, JSON.stringify(version, null, 2) + '\n');
}

function updatePackageJson(newVersion) {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_FILE, 'utf-8'));
  const oldVersion = pkg.version;
  pkg.version = newVersion;
  fs.writeFileSync(PACKAGE_FILE, JSON.stringify(pkg, null, 2) + '\n');
  return oldVersion;
}

function updateAppJsxVersion(newVersion) {
  if (!fs.existsSync(APP_JSX_FILE)) return false;
  const content = fs.readFileSync(APP_JSX_FILE, 'utf-8');
  const pattern = /(__APP_VERSION__\s*:\s*)'([^']+)'/;
  if (!pattern.test(content)) return false;
  const updated = content.replace(pattern, `$1'${newVersion}'`);
  fs.writeFileSync(APP_JSX_FILE, updated);
  return true;
}

function updateAndroidGradle(newVersion, versionCode) {
  if (!fs.existsSync(ANDROID_GRADLE_FILE)) return false;
  let content = fs.readFileSync(ANDROID_GRADLE_FILE, 'utf-8');
  content = content.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
  content = content.replace(/versionName\s+"[^"]+"/, `versionName "${newVersion}"`);
  fs.writeFileSync(ANDROID_GRADLE_FILE, content);
  return true;
}

function bumpVersion(type) {
  const ver = readVersion();
  const oldMajor = ver.major;
  const oldMinor = ver.minor;

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
  ver.releaseDate = new Date().toISOString().split('T')[0];
  ver.buildNumber = (ver.buildNumber || 0) + 1;

  return ver;
}

function addChangelog(version, message) {
  if (!message) return;
  const entry = `v${version.version}: ${message}`;
  version.changes = version.changes || [];
  version.changes.unshift(entry);
  version.notes = `${entry}. ${version.notes || ''}`;
}

function computeVersionCode(ver) {
  return ver.major * 10000 + ver.minor * 100 + ver.patch;
}

function main() {
  const args = process.argv.slice(2);
  const type = args[0];
  const message = args.slice(1).join(' ').trim();

  if (!type || !['major', 'minor', 'patch'].includes(type)) {
    console.log(`
ZMusic Version Bumper
=====================

Usage: node scripts/version.js <type> ["changelog message"]

Types:
  major    Breaking change (e.g. 7.5.0 -> 8.0.0)
  minor    New feature (e.g. 7.5.0 -> 7.6.0)
  patch    Bug fix (e.g. 7.5.0 -> 7.5.1)

Examples:
  node scripts/version.js patch "Fixed auth guard"
  node scripts/version.js minor "Added SMS registration"
  node scripts/version.js major "API redesign"
`);
    process.exit(type ? 1 : 0);
  }

  const current = readVersion();
  console.log(`\n=== ZMusic Version Bumper ===`);
  console.log(`Bump type:   ${type}`);
  console.log(`Current:     v${current.version}`);

  const newVer = bumpVersion(type);
  addChangelog(newVer, message);
  const versionCode = computeVersionCode(newVer);

  console.log(`New:         v${newVer.version}`);
  console.log(`Build #:     ${newVer.buildNumber}`);
  console.log(`VersionCode: ${versionCode}`);
  console.log(`Release:     ${newVer.releaseDate}`);
  if (message) console.log(`Changelog:   ${message}`);

  writeVersion(newVer);
  console.log(`\n[1/4] Updated VERSION.json -> v${newVer.version}`);

  const oldPkg = updatePackageJson(newVer.version);
  console.log(`[2/4] Updated package.json (${oldPkg} -> ${newVer.version})`);

  const appUpdated = updateAppJsxVersion(newVer.version);
  console.log(appUpdated
    ? `[3/4] Updated src/App.jsx BUILD_VERSION fallback -> v${newVer.version}`
    : `[3/4] src/App.jsx fallback not found (skipped)`);

  const gradleUpdated = updateAndroidGradle(newVer.version, versionCode);
  console.log(gradleUpdated
    ? `[4/4] Updated android/app/build.gradle -> versionName="${newVer.version}", versionCode=${versionCode}`
    : `[4/4] android/app/build.gradle not found (skipped)`);

  console.log(`\nDone! All version locations updated.`);
  console.log(`\nTo build with this version:`);
  console.log(`  npm run build`);
  console.log(`\nTo create git tag:`);
  console.log(`  git tag -a v${newVer.version} -m "Release v${newVer.version}"`);
}

main();