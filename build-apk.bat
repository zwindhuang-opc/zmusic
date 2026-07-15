@echo off
cd /d "%~dp0"
echo Building frontend...
npm run build
if %errorlevel% neq 0 (
    echo Frontend build failed!
    pause
    exit /b %errorlevel%
)
echo Frontend build succeeded.
echo Syncing Capacitor...
npx cap sync android
if %errorlevel% neq 0 (
    echo Capacitor sync failed!
    pause
    exit /b %errorlevel%
)
echo Capacitor sync succeeded.
echo Building APK...
cd android
call gradlew assembleDebug
if %errorlevel% neq 0 (
    echo APK build failed!
    pause
    exit /b %errorlevel%
)
echo APK build succeeded!
echo APK location: android\app\build\outputs\apk\debug\app-debug.apk
pause