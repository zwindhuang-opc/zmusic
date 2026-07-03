#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const __dirname = path.dirname(new URL(import.meta.url).pathname).replace(/^\//, '');

const VERSION_FILE = path.join(__dirname, '../VERSION.json');
const PACKAGE_FILE = path.join(__dirname, '../package.json');

function readVersion() {
    const data = fs.readFileSync(VERSION_FILE, 'utf-8');
    return JSON.parse(data);
}

function writeVersion(version) {
    fs.writeFileSync(VERSION_FILE, JSON.stringify(version, null, 2));
}

function updatePackageJson(newVersion) {
    const pkg = JSON.parse(fs.readFileSync(PACKAGE_FILE, 'utf-8'));
    pkg.version = newVersion;
    fs.writeFileSync(PACKAGE_FILE, JSON.stringify(pkg, null, 2));
}

function bumpVersion(type) {
    const version = readVersion();

    switch (type) {
        case 'major':
            version.major += 1;
            version.minor = 0;
            version.patch = 0;
            break;
        case 'minor':
            version.minor += 1;
            version.patch = 0;
            break;
        case 'patch':
            version.patch += 1;
            break;
        default:
            throw new Error(`Invalid bump type: ${type}. Use 'major', 'minor', or 'patch'.`);
    }

    version.version = `${version.major}.${version.minor}.${version.patch}`;
    version.releaseDate = new Date().toISOString().split('T')[0];
    version.buildNumber += 1;

    return version;
}

function gitCommitAndTag(version, message) {
    const tag = `v${version.version}`;

    try {
        execSync(`git add ${VERSION_FILE} ${PACKAGE_FILE}`, { stdio: 'inherit' });
        execSync(`git commit -m "${message}"`, { stdio: 'inherit' });
        execSync(`git tag ${tag}`, { stdio: 'inherit' });
        execSync('git push origin HEAD', { stdio: 'inherit' });
        execSync(`git push origin ${tag}`, { stdio: 'inherit' });
        console.log(`\nVersion ${tag} committed, tagged, and pushed to GitHub successfully!`);
    } catch (error) {
        console.error('Error during git operations:', error.message);
        process.exit(1);
    }
}

function showHelp() {
    console.log(`
ZMusic Version Bump Script
==========================

Usage: node scripts/version-bump.js <type> [message]

Types:
  major     - Bump major version (e.g., 1.0.0 -> 2.0.0)
  minor     - Bump minor version (e.g., 1.0.0 -> 1.1.0)
  patch     - Bump patch version (e.g., 1.0.0 -> 1.0.1)

Examples:
  node scripts/version-bump.js major "Major release with new features"
  node scripts/version-bump.js minor "Added new AI music generation"
  node scripts/version-bump.js patch "Fixed bug in lyrics display"

Options:
  --help    - Show this help message
  --current - Show current version
`);
}

function showCurrentVersion() {
    const version = readVersion();
    console.log(`Current Version: v${version.version}`);
    console.log(`Build Number: ${version.buildNumber}`);
    console.log(`Status: ${version.status}`);
    console.log(`Release Date: ${version.releaseDate}`);
}

function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help')) {
        showHelp();
        process.exit(0);
    }

    if (args.includes('--current')) {
        showCurrentVersion();
        process.exit(0);
    }

    const type = args[0];
    const message = args.slice(1).join(' ') || `Bump version to v${type}`;

    try {
        console.log(`\n=== Starting ${type} version bump ===`);
        console.log('Current version:', readVersion().version);

        const newVersion = bumpVersion(type);
        writeVersion(newVersion);
        updatePackageJson(newVersion.version);

        console.log('New version:', newVersion.version);
        console.log('Release date:', newVersion.releaseDate);

        gitCommitAndTag(newVersion, message);

        console.log(`\n=== Version bump completed successfully ===`);
        console.log(`Version: v${newVersion.version}`);
        console.log(`Build: #${newVersion.buildNumber}`);

    } catch (error) {
        console.error('\nError:', error.message);
        process.exit(1);
    }
}

main();