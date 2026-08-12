@echo off
REM ============================================================
REM   ZMusic Mobile Build Script
REM   - Builds the web app (npm run build)
REM   - Syncs Capacitor Android (npx cap sync android)
REM   - Builds the Android APK (gradlew assembleRelease, falls
REM     back to assembleDebug on failure)
REM   - Copies the APK to releases\zmusic-v{version}.apk
REM
REM   Keystore: android\keystore\zmusic.jks
REM ============================================================
setlocal enabledelayedexpansion

set "SCRIPT_DIR=%~dp0"
set "ROOT=%SCRIPT_DIR%.."
cd /d "%ROOT%"

REM --- Read version from package.json via node ---
for /f "delims=" %%v in ('node -e "console.log(require('./package.json').version)"') do set "VERSION=%%v"

echo ============================================================
echo   ZMusic Mobile Build
echo   Version:  v!VERSION!
echo   Keystore: android\keystore\zmusic.jks
echo ============================================================
echo.

REM --- Step 1: Build web app ---
echo [1/4] Building web app ^(npm run build^)...
call npm run build
if errorlevel 1 (
    echo.
    echo ============================================================
    echo   [FAILED] Web build failed.
    echo ============================================================
    exit /b 1
)
echo.

REM --- Step 2: Sync Capacitor Android ---
echo [2/4] Syncing Capacitor ^(npx cap sync android^)...
call npx cap sync android
if errorlevel 1 (
    echo.
    echo ============================================================
    echo   [FAILED] Capacitor sync failed.
    echo ============================================================
    exit /b 1
)
echo.

REM --- Step 3: Build Android APK ---
echo [3/4] Building Android APK ^(assembleRelease^)...
set "APK_PATH="
set "APK_TYPE="
pushd android
call gradlew assembleRelease
if errorlevel 1 (
    echo.
    echo [WARNING] Release build failed, trying debug build ^(assembleDebug^)...
    call gradlew assembleDebug
    if errorlevel 1 (
        echo.
        echo ============================================================
        echo   [FAILED] Debug build also failed.
        echo ============================================================
        popd
        exit /b 1
    )
    set "APK_PATH=android\app\build\outputs\apk\debug\app-debug.apk"
    set "APK_TYPE=debug"
) else (
    set "APK_PATH=android\app\build\outputs\apk\release\app-release.apk"
    set "APK_TYPE=release"
)
popd
echo Built !APK_TYPE! APK: !APK_PATH!
echo.

REM --- Step 4: Copy APK to releases\ ---
echo [4/4] Copying APK to releases\...
if not exist releases mkdir releases
if not exist "!APK_PATH!" (
    echo.
    echo ============================================================
    echo   [FAILED] APK not found at !APK_PATH!
    echo ============================================================
    exit /b 1
)
copy /Y "!APK_PATH!" "releases\zmusic-v!VERSION!.apk" >nul
if errorlevel 1 (
    echo.
    echo ============================================================
    echo   [FAILED] Could not copy APK to releases\.
    echo ============================================================
    exit /b 1
)

echo.
echo ============================================================
echo   [SUCCESS] APK built and copied.
echo   Output:   releases\zmusic-v!VERSION!.apk
echo   Type:     !APK_TYPE!
echo   Keystore: android\keystore\zmusic.jks
echo ============================================================
endlocal
