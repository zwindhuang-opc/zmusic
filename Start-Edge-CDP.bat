@echo off
REM ============================================================
REM  Start-Edge-CDP.bat
REM  Launches Microsoft Edge with Chrome DevTools Protocol enabled
REM  on port 9222 so the zmusic backend (museCdpBridge.js) can
REM  attach to the user's logged-in session and read Muse credits.
REM
REM  Usage: Double-click this file, or run from a terminal.
REM ============================================================

setlocal

REM --- Locate Edge executable ----------------------------------
set "EDGE_EXE=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE_EXE%" set "EDGE_EXE=C:\Program Files\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE_EXE%" set "EDGE_EXE=%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE_EXE%" (
  echo [ERROR] Cannot find Microsoft Edge. Please install Edge first.
  pause
  exit /b 1
)

REM --- User data dir (separate profile so we don't collide) ----
set "EDGE_USER_DATA=%LOCALAPPDATA%\Microsoft\Edge\ZMusic-CDP-Profile"

REM --- Kill any existing Edge instances (clean start) ----------
echo [INFO] Closing any running Edge instances...
taskkill /F /IM msedge.exe /T >nul 2>&1
timeout /t 1 /nobreak >nul

echo [INFO] Starting Edge with CDP on port 9222...
echo [INFO] User data dir: %EDGE_USER_DATA%
echo.

start "" "%EDGE_EXE%" ^
  --remote-debugging-port=9222 ^
  --user-data-dir="%EDGE_USER_DATA%" ^
  --no-first-run ^
  --no-default-browser-check ^
  --disable-features=Translate ^
  https://muse.top/

echo.
echo [OK] Edge launched in CDP mode.
echo      Open http://localhost:9222/json in any browser to verify targets.
echo      Log in to muse.top if you haven't already.
echo.
pause
endlocal
