#!/usr/bin/env bash
#
# build-ios.sh - Build a signed ZMusic iOS IPA (v5.4.0) on macOS.
#
# Usage:
#   ./build-ios.sh                  # development export (default)
#   ./build-ios.sh app-store        # app-store export
#   ./build-ios.sh ad-hoc           # ad-hoc export
#
# Prerequisites (macOS only):
#   - Xcode (xcodebuild) + Command Line Tools
#   - CocoaPods (sudo gem install cocoapods)
#   - Node.js >= 18 and npm
#   - A valid Apple Developer signing identity + provisioning profile
#     configured for bundle id com.zmusic.app (Automatic Signing is on).
#
set -euo pipefail

# --- Config ------------------------------------------------------------------
APP_NAME="ZMusic"
APP_VERSION="5.4.0"
BUNDLE_ID="com.zmusic.app"
SCHEME="App"
WORKSPACE="ios/App/App.xcworkspace"
ARCHIVE_DIR="build/ios"
ARCHIVE_PATH="${ARCHIVE_DIR}/${APP_NAME}.xcarchive"
IPA_DIR="${ARCHIVE_DIR}/ipa"
FINAL_IPA="zmusic-v${APP_VERSION}-signed.ipa"

EXPORT_METHOD="${1:-development}"   # development | app-store | ad-hoc | enterprise

# --- Resolve project root (script location) ----------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
PROJECT_ROOT="$SCRIPT_DIR"

# --- Preflight checks --------------------------------------------------------
echo "==> Preflight checks"

if [[ "$(uname)" != "Darwin" ]]; then
  echo "[ERROR] This script must be run on macOS. Xcode/xcodebuild is required to build an IPA." >&2
  exit 1
fi

if ! command -v xcodebuild >/dev/null 2>&1; then
  echo "[ERROR] xcodebuild not found. Install Xcode from the App Store and run:" >&2
  echo "    sudo xcode-select -s /Applications/Xcode.app/Contents/Developer" >&2
  exit 1
fi

if ! command -v pod >/dev/null 2>&1; then
  echo "[ERROR] CocoaPods (pod) not found. Install with:" >&2
  echo "    sudo gem install cocoapods" >&2
  exit 1
fi

if ! command -v npx >/dev/null 2>&1; then
  echo "[ERROR] Node.js/npm not found. Install Node.js >= 18." >&2
  exit 1
fi

echo "    macOS detected, Xcode + CocoaPods + Node available."
echo "    Export method: ${EXPORT_METHOD}"

# --- Step 1: Build frontend --------------------------------------------------
echo ""
echo "==> [1/5] Building frontend (vite build)"
npm run build

# --- Step 2: Sync Capacitor iOS ---------------------------------------------
echo ""
echo "==> [2/5] Syncing Capacitor iOS"
npx cap sync ios

# --- Step 3: Install CocoaPods dependencies ---------------------------------
echo ""
echo "==> [3/5] Installing CocoaPods dependencies"
(
  cd ios/App
  pod install --repo-update
)

# --- Step 4: Archive ---------------------------------------------------------
echo ""
echo "==> [4/5] Archiving ${APP_NAME} v${APP_VERSION} (${SCHEME})"
rm -rf "$ARCHIVE_DIR"
mkdir -p "$ARCHIVE_DIR"

xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration Release \
  -archivePath "$ARCHIVE_PATH" \
  -destination "generic/platform=iOS" \
  archive \
  | tee "${ARCHIVE_DIR}/archive.log"

if [[ ! -d "$ARCHIVE_PATH" ]]; then
  echo "[ERROR] Archive failed - ${ARCHIVE_PATH} was not created." >&2
  echo "        See ${ARCHIVE_DIR}/archive.log for details." >&2
  exit 1
fi

# --- Step 5: Export IPA ------------------------------------------------------
echo ""
echo "==> [5/5] Exporting IPA (${EXPORT_METHOD})"

EXPORT_PLIST="${ARCHIVE_DIR}/ExportOptions.plist"
cat > "$EXPORT_PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>${EXPORT_METHOD}</string>
    <key>teamID</key>
    <string></string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <false/>
    <key>compileBitcode</key>
    <false/>
    <key>stripSwiftSymbols</key>
    <true/>
    <key>thinning</key>
    <string>&lt;none&gt;</string>
</dict>
</plist>
EOF

rm -rf "$IPA_DIR"
mkdir -p "$IPA_DIR"

xcodebuild \
  -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportOptionsPlist "$EXPORT_PLIST" \
  -exportPath "$IPA_DIR" \
  | tee "${ARCHIVE_DIR}/export.log"

# --- Copy final IPA to project root -----------------------------------------
BUILT_IPA="$(find "$IPA_DIR" -name '*.ipa' -print -quit || true)"
if [[ -z "$BUILT_IPA" || ! -f "$BUILT_IPA" ]]; then
  echo "[ERROR] IPA export failed - no .ipa found in ${IPA_DIR}." >&2
  echo "        See ${ARCHIVE_DIR}/export.log for details." >&2
  exit 1
fi

cp -f "$BUILT_IPA" "$FINAL_IPA"

IPA_SIZE="$(du -h "$FINAL_IPA" | cut -f1)"

echo ""
echo "============================================================"
echo " BUILD SUCCESSFUL"
echo "============================================================"
echo " App            : ${APP_NAME} v${APP_VERSION}"
echo " Bundle ID      : ${BUNDLE_ID}"
echo " Export method  : ${EXPORT_METHOD}"
echo " Archive        : ${ARCHIVE_PATH}"
echo " Final IPA      : ${PROJECT_ROOT}/${FINAL_IPA}"
echo " IPA size       : ${IPA_SIZE}"
echo "============================================================"
