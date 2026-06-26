@echo off
cd /d "%~dp0"
title Church Connect
color 0A

echo.
echo  ==============================
echo    Church Connect
echo  ==============================
echo.

node -v >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Node.js not found.
    echo  Install from: https://nodejs.org
    pause
    exit /b
)

if not exist "data" mkdir data

set NODE_ENV=production
set PORT=5000
set SESSION_SECRET=church2024

echo  Opening at http://localhost:5000
echo  Login: sam_2323 / sam@2323
echo  Keep this window open!
echo.

start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5000"

node dist\index.cjs

pause
