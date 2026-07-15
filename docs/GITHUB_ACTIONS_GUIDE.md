# GitHub Actions Guide: Build iOS IPA from Windows

This guide walks you through building a signed iOS IPA from your Windows PC using GitHub Actions' free macOS runners.

---

## Overview

GitHub Actions provides free macOS runners (macos-latest) that have Xcode pre-installed. You trigger a build from your browser, GitHub builds the IPA on a cloud Mac, and you download the result.

```
Your Windows PC  →  GitHub.com  →  Cloud macOS Runner  →  Download IPA
                   (click button)  (Xcode builds IPA)      (artifact)
```

**Cost:** Free for public repositories
**Build time:** ~10-15 minutes
**Output:** Downloadable .ipa file

---

## Prerequisites

1. A GitHub account (you already have one: `vcfhuang`)
2. Your project pushed to GitHub (already done: `vcfhuang/zmusic`)
3. The workflow file (already created: `.github/workflows/build-ios.yml`)

---

## Step-by-Step Guide

### Step 1: Open GitHub Actions

1. Open your browser
2. Go to: **https://github.com/vcfhuang/zmusic/actions**
3. You'll see a list of workflows. Look for **"Build iOS IPA"** in the left sidebar

> If you don't see it, the workflow file may not have been pushed. Run:
> ```bash
> git add .github/workflows/build-ios.yml
> git commit -m "Add iOS build workflow"
> git push
> ```

### Step 2: Trigger the Build

1. Click **"Build iOS IPA"** in the left sidebar
2. You'll see a page with past runs (empty if first time)
3. Click the **"Run workflow"** button (top-right, green button with dropdown)
4. A dropdown appears with options:
   - **Branch:** `master` (leave default)
   - **Export method:** Choose one:
     - `development` - For testing on your own devices (default)
     - `ad-hoc` - For distributing to specific devices
     - `app-store` - For App Store submission
5. Click the green **"Run workflow"** button to confirm

### Step 3: Monitor the Build

1. You'll see a new run appear at the top of the list with a yellow dot (running)
2. Click on the run title (e.g., "Add GitHub Actions workflow...") to see details
3. You'll see a job called `build-ios` — click on it to expand the live log
4. The build goes through these stages:
   - **Checkout code** (~5 seconds)
   - **Setup Node.js** (~10 seconds)
   - **Install dependencies** (~30 seconds)
   - **Build frontend** (~30 seconds) - Vite builds the React app
   - **Sync Capacitor iOS** (~10 seconds) - Copies assets to iOS project
   - **Install CocoaPods** (~60 seconds) - iOS dependency management
   - **Build IPA** (~5-8 minutes) - Xcode compiles and archives
   - **Upload artifact** (~10 seconds)

Total time: approximately 10-15 minutes

### Step 4: Download the IPA

1. When the build completes, the yellow dot turns green (checkmark)
2. Scroll to the bottom of the run page
3. Look for the **"Artifacts"** section
4. Click **"zmusic-ios-ipa"** to download
5. A ZIP file downloads — extract it to find `zmusic-v*-ios.ipa`

### Step 5: Install on Your iPhone

#### Method A: Sideloadly (Windows, Free)
1. Download [Sideloadly](https://sideloadly.io/) for Windows
2. Connect your iPhone via USB
3. Open Sideloadly, enter your Apple ID
4. Drag the `.ipa` file into Sideloadly
5. Click "Start" to install

#### Method B: AltStore (Windows, Free)
1. Download [AltStore](https://altstore.io/) for Windows
2. Install AltServer on your PC
3. Connect iPhone via USB
4. Use AltStore to sideload the IPA

#### Method C: TestFlight (Requires Apple Developer Account - $99/year)
1. Upload signed IPA to App Store Connect
2. Add testers in TestFlight
3. Testers install via TestFlight app

> **Note:** Free Apple ID sideloading expires after 7 days. Re-sideload to refresh.

---

## Signed Builds (Optional - For App Store)

By default, the workflow builds an **unsigned** IPA (fine for testing). For App Store distribution, add signing secrets:

### Step 1: Get Your Apple Certificate

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Create a distribution certificate
4. Export it as `.p12` file with a password
5. Create a provisioning profile for `com.zmusic.app`

### Step 2: Add GitHub Secrets

1. Go to: **https://github.com/vcfhuang/zmusic/settings/secrets/actions**
2. Click **"New repository secret"**
3. Add these secrets:

| Secret Name | Value | How to Get |
|-------------|-------|------------|
| `IOS_CERTIFICATE_P12` | Base64-encoded .p12 file | `base64 -i certificate.p12` on Mac, or use online base64 encoder |
| `IOS_CERTIFICATE_PASSWORD` | Password you set when exporting .p12 | Your password |
| `IOS_PROVISIONING_PROFILE` | Base64-encoded .mobileprovision file | `base64 -i profile.mobileprovision` on Mac |

### Step 3: Build with Signing

Once secrets are added, the workflow automatically detects them and builds a signed IPA. Choose `app-store` as the export method.

---

## Troubleshooting GitHub Actions

### Build Fails at "Build IPA" Step

**Common causes:**
- Code signing issues → Use unsigned build (don't add secrets)
- Missing provisioning profile → Ensure profile matches bundle ID `com.zmusic.app`
- Xcode version mismatch → The workflow uses `macos-latest` which has the latest Xcode

**Check the logs:**
1. Click on the failed run
2. Click `build-ios` job
3. Expand the failed step to see error details

### No Artifacts Section

If the build succeeds but no artifacts appear:
- The IPA generation may have failed silently
- Check the "Build IPA" step logs for errors
- Ensure the `xcodebuild -exportArchive` command succeeded

### Workflow Not Visible

If "Build iOS IPA" doesn't appear in Actions:
1. Verify the file exists: `.github/workflows/build-ios.yml`
2. Ensure it's pushed to the `master` branch
3. Check the YAML syntax is valid
4. GitHub may take a few seconds to index new workflows

### Build Takes Too Long

- Normal build time: 10-15 minutes
- If exceeding 30 minutes, check if CocoaPods is stuck
- GitHub free tier: 2000 minutes/month for private repos, unlimited for public

---

## Workflow File Reference

The workflow file is at: [`.github/workflows/build-ios.yml`](../.github/workflows/build-ios.yml)

### Triggers

| Trigger | Condition |
|---------|-----------|
| `workflow_dispatch` | Manual trigger from GitHub UI |
| `push` to `master` | Auto-trigger on code changes to `src/`, `ios/`, `package.json` |

### Export Methods

| Method | Use Case | Requires Signing |
|--------|----------|------------------|
| `development` | Test on your own devices | No (unsigned OK) |
| `ad-hoc` | Distribute to specific devices | Yes |
| `app-store` | Submit to App Store | Yes |

---

## FAQ

**Q: Is this really free?**
A: Yes, for public repositories. GitHub provides 2000 free minutes/month for private repos.

**Q: Can I build Android APK this way too?**
A: Yes, but you don't need to — APK builds work natively on Windows. See the README.

**Q: Do I need an Apple Developer account?**
A: For unsigned/testing builds: No. For App Store distribution: Yes ($99/year).

**Q: How long does the IPA stay downloadable?**
A: 90 days. Re-run the workflow to generate a fresh artifact.

**Q: Can I automate builds on every push?**
A: Already configured! Pushes to `master` that change `src/`, `ios/`, or `package.json` auto-trigger a build.
