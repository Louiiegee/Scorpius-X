const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Comprehensive project fix starting...');

// Step 1: Fix package.json
try {
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Remove problematic configurations
  delete packageJson.resolutions;
  delete packageJson.overrides;
  delete packageJson.type; // Remove ES module type that's causing issues
  
  // Fix rollup version and add missing dependencies
  packageJson.devDependencies = packageJson.devDependencies || {};
  packageJson.devDependencies.rollup = "3.26.0";
  packageJson.devDependencies.rimraf = "^5.0.5";
  
  // Add clean script
  packageJson.scripts = packageJson.scripts || {};
  packageJson.scripts.clean = "rimraf node_modules package-lock.json";
  packageJson.scripts.fresh = "npm run clean && npm install --legacy-peer-deps";
  
  // Remove problematic dependencies that cause platform issues
  if (packageJson.dependencies && packageJson.dependencies.inotify) {
    delete packageJson.dependencies.inotify;
  }
  if (packageJson.devDependencies && packageJson.devDependencies.inotify) {
    delete packageJson.devDependencies.inotify;
  }
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Fixed package.json');
  
} catch (error) {
  console.error('❌ Error fixing package.json:', error.message);
}

// Step 2: Create a Windows-compatible cleanup script
const cleanupScript = `
@echo off
echo Cleaning project...
taskkill /F /IM electron.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

if exist package-lock.json del /F package-lock.json
if exist node_modules (
  echo Moving node_modules to temp location...
  if exist node_modules_old rmdir /S /Q node_modules_old
  move node_modules node_modules_old
  start /B powershell -Command "Start-Sleep 5; Remove-Item node_modules_old -Recurse -Force -ErrorAction SilentlyContinue"
)

echo Cleanup complete!
`;

fs.writeFileSync(path.join(__dirname, 'cleanup.bat'), cleanupScript);
console.log('✅ Created cleanup.bat script');

console.log('\n🚀 Next steps:');
console.log('1. Run: cleanup.bat');
console.log('2. Wait 10 seconds');
console.log('3. Run: npm install rimraf --no-save');
console.log('4. Run: npm install --legacy-peer-deps --force');
console.log('5. Run: npm run dev');
