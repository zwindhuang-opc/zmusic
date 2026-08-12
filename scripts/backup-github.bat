@echo off
REM ============================================================
REM   ZMusic GitHub Backup Script
REM   - Runs version-manager.mjs with a patch bump
REM   - Stages and commits any remaining changes
REM   - Pushes to origin master
REM ============================================================
setlocal enabledelayedexpansion

set "SCRIPT_DIR=%~dp0"
set "ROOT=%SCRIPT_DIR%.."
cd /d "%ROOT%"

echo ============================================================
echo   ZMusic GitHub Backup
echo ============================================================
echo.

REM --- Step 1: Run version-manager with patch bump ---
echo [1/2] Running version-manager (patch bump)...
call node scripts\version-manager.mjs patch "patch backup release"
if errorlevel 1 (
    echo.
    echo ============================================================
    echo   [FAILED] Version manager did not complete.
    echo ============================================================
    exit /b 1
)
echo.

REM --- Step 2: Stage and commit any remaining changes ---
echo [2/2] Backing up remaining changes...
git add -A
git commit -m "Backup changes"
if errorlevel 1 (
    echo No additional changes to commit ^(version-manager already committed everything^).
) else (
    echo Committed remaining changes.
)

echo Pushing to origin master...
git push origin master
if errorlevel 1 (
    echo.
    echo ============================================================
    echo   [FAILED] Push to origin master failed.
    echo   Changes are committed locally; retry when online.
    echo ============================================================
    exit /b 1
)

echo.
echo ============================================================
echo   [SUCCESS] GitHub backup complete.
echo ============================================================
endlocal
