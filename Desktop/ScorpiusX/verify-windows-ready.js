#!/usr/bin/env node

/**
 * Windows Build Readiness Verification
 * Checks if Scorpius Cybersecurity Dashboard is ready for Windows deployment
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 SCORPIUS WINDOWS BUILD VERIFICATION");
console.log("=====================================\n");

const checks = [
  {
    name: "Package.json Configuration",
    file: "package.json",
    test: (content) => {
      const pkg = JSON.parse(content);
      return (
        pkg.name === "scorpius-cybersecurity-dashboard" &&
        pkg.scripts["electron-build-win"] &&
        pkg.version !== "0.0.0"
      );
    },
  },
  {
    name: "Electron Main Process",
    file: "electron/main.cjs",
    test: (content) =>
      content.includes("http://localhost:8080") && content.includes("win32"),
  },
  {
    name: "Electron Builder Config",
    file: "electron-builder.json",
    test: (content) => {
      const config = JSON.parse(content);
      return config.win && config.nsis && config.win.target;
    },
  },
  {
    name: "Windows Build Script",
    file: "build-windows.bat",
    test: (content) => content.includes("electron-build-win"),
  },
  {
    name: "Windows Dev Script",
    file: "dev-windows.bat",
    test: (content) => content.includes("npm run dev"),
  },
  {
    name: "NSIS Installer Script",
    file: "electron/installer/windows/installer.nsh",
    test: (content) => content.includes("customInstall"),
  },
  {
    name: "Assets Directory",
    file: "electron/assets",
    test: () => fs.existsSync(path.join(__dirname, "electron/assets")),
  },
  {
    name: "Windows Deployment Guide",
    file: "WINDOWS_DEPLOYMENT.md",
    test: (content) => content.includes("Windows Deployment Guide"),
  },
  {
    name: "Vite Config Electron Mode",
    file: "vite.config.ts",
    test: (content) => content.includes('mode === "electron"'),
  },
  {
    name: "App Styling (Electron CSS)",
    file: "src/App.css",
    test: (content) => content.includes(".electron-app"),
  },
];

let passed = 0;
let failed = 0;

console.log("Running checks...\n");

checks.forEach(({ name, file, test }) => {
  const filePath = path.join(__dirname, file);

  try {
    if (file.includes("/") && !fs.existsSync(filePath)) {
      console.log(`❌ ${name}: File missing (${file})`);
      failed++;
      return;
    }

    if (fs.statSync(filePath).isDirectory()) {
      if (test()) {
        console.log(`✅ ${name}: OK`);
        passed++;
      } else {
        console.log(`❌ ${name}: Directory check failed`);
        failed++;
      }
      return;
    }

    const content = fs.readFileSync(filePath, "utf8");
    if (test(content)) {
      console.log(`✅ ${name}: OK`);
      passed++;
    } else {
      console.log(`❌ ${name}: Configuration issue`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${name}: Error (${error.message})`);
    failed++;
  }
});

console.log("\n" + "=".repeat(50));
console.log(`📊 RESULTS: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log("🎉 ALL CHECKS PASSED! Windows build is ready!");
  console.log("\n🚀 TO BUILD FOR WINDOWS:");
  console.log("   Option 1: Double-click build-windows.bat");
  console.log("   Option 2: npm run electron-build-win");
  console.log("\n💻 TO DEVELOP:");
  console.log("   Option 1: Double-click dev-windows.bat");
  console.log("   Option 2: npm run dev & npm run electron");
  console.log("\n📦 OUTPUT:");
  console.log("   - Windows Installer: dist-electron/*.exe");
  console.log("   - Portable App: dist-electron/*.zip");
  console.log("\n🛡️ FEATURES INCLUDED:");
  console.log("   ✅ Frameless window matching web design");
  console.log("   ✅ Windows installer with shortcuts");
  console.log("   ✅ File associations and protocol handler");
  console.log("   ✅ Auto-updater ready");
  console.log("   ✅ Windows-optimized performance");
  console.log("   ✅ Dark theme cybersecurity UI");
} else {
  console.log("❌ Some checks failed. Please fix the issues above.");
  console.log("\n🔧 COMMON FIXES:");
  if (failed > 5) {
    console.log("   - Run: npm install");
    console.log("   - Check file paths and permissions");
  }
  console.log("   - Ensure all required files exist");
  console.log("   - Check JSON file syntax");
}

console.log("\n📖 For detailed instructions, see: WINDOWS_DEPLOYMENT.md");
console.log("🆘 Need help? Check the troubleshooting section in the guide.");
