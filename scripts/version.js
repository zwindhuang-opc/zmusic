#!/usr/bin/env node
/**
 * version.js — Semantic version bumping script for ZMusic
 *
 * Reads VERSION.json, bumps the requested version component (major/minor/patch),
 * writes updated files back, and outputs the git tag command.
 *
 * Usage:
 *   node scripts/version.js [major|minor|patch]
 *
 * @module scripts/version
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const VERSION_FILE = path.join(ROOT, 'VERSION.json');
const PACKAGE_FILE = path.join(ROOT, 'package.json');

/**
 * Read and parse VERSION.json from the project root.
 * @returns {object} Parsed version object
 */
function readVersion() {
  return JSON.parse(fs.readFileSync(VERSION_FILE, 'utf-8'));
}

/**
 * Write the version object back to VERSION.json with pretty-printing.
 * @param {object} version - The version object to persist
 */
function writeVersion(version) {
  fs.writeFileSync(VERSION_FILE, JSON.stringify(version, null, 2) + '\n');
}

/**
 * Update the version field in package.json to match the new version.
 * @param {string} newVersion - Semver string (e.g. "1.1.0")
 */
function updatePackageJson(newVersion) {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_FILE, 'utf-8'));
  pkg.version = newVersion;
  fs.writeFileSync(PACKAGE_FILE, JSON.stringify(pkg, null, 2) + '\n');
}

/**
 * Bump the semantic version by the specified type.
 * Follows Semantic Versioning 2.0.0:
 *   - major: breaking change, resets minor and patch to 0
 *   - minor: new feature (backward-compatible), resets patch to 0
 *   - patch: bug fix, backward-compatible
 *
 * @param {'major'|'minor'|'patch'} type - The version component to bump
 * @returns {object} Updated version object
 */
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
  ver.releaseDate = new Date().toISOString().split('T')[0];

  return ver;
}

/**
 * Entry point: parse CLI args, bump version, write files, output git tag command.
 */
function main() {
  const args = process.argv.slice(2);
  const type = args[0];

  if (!type || !['major', 'minor', 'patch'].includes(type)) {
    console.log(`
ZMusic Version Bumper
=====================

Usage: node scripts/version.js <type>

Types:
  major    Breaking change (e.g. 1.0.0 -> 2.0.0)
  minor    New feature (e.g. 1.0.0 -> 1.1.0)
  patch    Bug fix (e.g. 1.0.0 -> 1.0.1)

Examples:
  node scripts/version.js patch
  node scripts/version.js minor
  node scripts/version.js major
`);
    process.exit(type ? 1 : 0);
  }

  const current = readVersion();
  console.log(`Current version: v${current.version}`);

  const newVer = bumpVersion(type);
  writeVersion(newVer);
  updatePackageJson(newVer.version);

  console.log(`New version:     v${newVer.version}`);
  console.log(`Release date:    ${newVer.releaseDate}`);
  console.log(`Updated:         VERSION.json, package.json`);
  console.log(`\nGit tag command:`);
  console.log(`  git tag -a v${newVer.version} -m "Release v${newVer.version}"`);
  console.log(`  git push origin v${newVer.version}`);
}

main();