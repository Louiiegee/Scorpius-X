const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing package.json and dependencies...');

// Get package.json path
const packageJsonPath = path.join(__dirname, 'package.json');

try {
  // Read and parse package.json
  const packageJsonRaw = fs.readFileSync(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonRaw);
  
  console.log('📦 Removing problematic overrides and resolutions...');
  
  // Remove problematic sections
  if (packageJson.resolutions) delete packageJson.resolutions;
  if (packageJson.overrides) delete packageJson.overrides;
  
  // Fix rollup version to stable version
  if (packageJson.devDependencies && packageJson.devDependencies.rollup) {
    console.log('📋 Setting rollup to fixed version 3.26.0');
    packageJson.devDependencies.rollup = "3.26.0";
  }
  
  // Add clean script
  packageJson.scripts = packageJson.scripts || {};
  packageJson.scripts.clean = "rimraf node_modules package-lock.json";
  
  // Write back the fixed package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Successfully updated package.json');
  
  // Install rimraf for clean script
  console.log('📦 Installing rimraf for cleanup...');
  execSync('npm install rimraf --no-save', { stdio: 'inherit' });
  
  console.log('\n🚀 Next steps:');
  console.log('1. Close all terminal windows and VS Code');
  console.log('2. Restart your computer');
  console.log('3. After restart, run: npm run clean');
  console.log('4. Then run: npm install --legacy-peer-deps --force');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
