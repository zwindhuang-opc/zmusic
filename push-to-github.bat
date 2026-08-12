@echo off
echo ==========================================
echo  ZMusic V7.1.0 - GitHub Push Script
echo ==========================================
echo.
echo Attempting to push to GitHub...
echo.

cd /d e:\AI_Projects\zmusic

echo [1/3] Pushing master branch...
git push origin master
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [FAILED] Could not push master branch.
    echo GitHub may be unreachable. Try again later.
    pause
    exit /b 1
)

echo.
echo [2/3] Pushing all tags...
git push origin --tags
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [WARNING] Could not push some tags.
)

echo.
echo [3/3] Verifying remote status...
git branch -vv
echo.
echo ==========================================
echo  Push complete! V7.1.0 is now on GitHub.
echo ==========================================
pause
