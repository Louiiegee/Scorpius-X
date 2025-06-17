@echo off
echo Cleaning up npm dependencies...

echo 1. Killing any running Electron processes
taskkill /F /IM electron.exe /T >nul 2>&1
taskkill /F /IM electron.exe >nul 2>&1
timeout /t 2 >nul

echo 2. Removing package-lock.json
if exist package-lock.json del /F package-lock.json

echo 3. Creating fresh setup
echo WARNING: Will restart your computer if needed to unlock files
choice /M "Continue with fresh setup (may restart computer)?"
if errorlevel 2 goto MANUAL_CLEANUP

echo 4. Moving instead of deleting node_modules
if exist node_modules (
  echo Moving node_modules to a temporary location
  move node_modules node_modules_old
)

echo 5. Installing dependencies with legacy-peer-deps...
call npm install --legacy-peer-deps

echo 6. Installing specific rollup version
call npm install rollup@3.26.0 --save-dev --legacy-peer-deps

echo 7. Cleaning up old modules
if exist node_modules_old (
  echo Removing old modules - may fail if still locked
  rmdir /S /Q node_modules_old 2>nul
)

echo Dependencies fixed! Try running 'npm run electron:dev' again.
goto END

:MANUAL_CLEANUP
echo Please try these manual steps:
echo 1. Close all VS Code, command prompt, and terminal windows
echo 2. Restart your computer
echo 3. After restart, delete the node_modules folder manually
echo 4. Run: npm install --legacy-peer-deps
echo 5. Run: npm install rollup@3.26.0 --save-dev

:END
