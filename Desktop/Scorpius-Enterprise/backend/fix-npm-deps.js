const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

console.log('🔧 Fixing npm dependency conflicts...');

// Read package.json
const packageJsonPath = path.join(__dirname, 'package.json');
let packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Remove problematic overrides and resolutions
if (packageJson.overrides) {
  console.log('Removing overrides section...');
  delete packageJson.overrides;
}

if (packageJson.resolutions) {
  console.log('Removing resolutions section...');
  delete packageJson.resolutions;
}

// Fix rollup version
if (packageJson.devDependencies && packageJson.devDependencies.rollup) {
  console.log('Setting rollup version to 3.26.0...');
  packageJson.devDependencies.rollup = "3.26.0";
}

// Save changes
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('✅ package.json updated successfully');

// Clean npm cache
try {
  console.log('Cleaning npm cache...');
  execSync('npm cache clean --force', { stdio: 'inherit' });
} catch (error) {
  console.error('Error cleaning npm cache:', error.message);
}

console.log('🔧 Now run: npm install --legacy-peer-deps');