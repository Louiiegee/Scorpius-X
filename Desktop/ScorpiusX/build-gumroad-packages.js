#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const archiver = require("archiver");

// Configuration
const PACKAGE_DIR = "gumroad-packages";
const DIST_ELECTRON_DIR = "dist-electron";

// Colors for output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg) =>
    console.log(`${colors.bright}${colors.magenta}${msg}${colors.reset}`),
};

// Ensure packages directory exists
function ensurePackageDir() {
  if (!fs.existsSync(PACKAGE_DIR)) {
    fs.mkdirSync(PACKAGE_DIR, { recursive: true });
    log.info(`Created package directory: ${PACKAGE_DIR}`);
  }
}

// Create ZIP archive
function createZip(sourceDir, outputPath, platformName) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      log.success(
        `${platformName} package created: ${archive.pointer()} bytes`,
      );
      resolve();
    });

    archive.on("error", (err) => {
      log.error(`Archive error for ${platformName}: ${err.message}`);
      reject(err);
    });

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

// Copy documentation files
function copyDocumentation() {
  const docs = [
    "README.md",
    "ELECTRON_README.md",
    "GUMROAD_DISTRIBUTION.md",
    "USER_GUIDE.md",
  ];

  docs.forEach((doc) => {
    if (fs.existsSync(doc)) {
      const destPath = path.join(PACKAGE_DIR, doc);
      fs.copyFileSync(doc, destPath);
      log.info(`Copied ${doc} to package directory`);
    }
  });
}

// Create license file
function createLicenseFile() {
  const licenseContent = `
SCORPIUS CYBERSECURITY DASHBOARD
END USER LICENSE AGREEMENT

1. GRANT OF LICENSE
This license grants you the right to use Scorpius on a single computer system.

2. RESTRICTIONS
- No reverse engineering or redistribution
- Commercial use permitted for licensee only
- No resale or sublicensing

3. SUPPORT
Lifetime updates included with purchase.
Support available through official channels.

4. WARRANTY DISCLAIMER
Software provided "as is" without warranty.

5. LIMITATION OF LIABILITY
Liability limited to purchase price.

Copyright © 2024 Scorpius Security. All rights reserved.
`;

  const licensePath = path.join(PACKAGE_DIR, "LICENSE.txt");
  fs.writeFileSync(licensePath, licenseContent.trim());
  log.info("Created license file");
}

// Create installation guide
function createInstallationGuide() {
  const installGuide = `
# Scorpius Cybersecurity Dashboard - Installation Guide

## System Requirements

### Windows
- Windows 10 or later (64-bit)
- 4GB RAM minimum (8GB recommended)
- 2GB free disk space
- Internet connection for live data

### macOS
- macOS 10.14 (Mojave) or later
- 4GB RAM minimum (8GB recommended)
- 2GB free disk space
- Internet connection for live data

### Linux
- Ubuntu 18.04 LTS or equivalent
- 4GB RAM minimum (8GB recommended)
- 2GB free disk space
- Internet connection for live data

## Installation Instructions

### Windows
1. Download the Windows package
2. Extract the ZIP file to your desired location
3. Run "Scorpius-Setup.exe" as Administrator
4. Follow the installation wizard
5. Launch Scorpius from the Start Menu or Desktop

### macOS
1. Download the macOS package
2. Extract the ZIP file
3. Open the DMG file
4. Drag Scorpius to Applications folder
5. Launch from Applications (you may need to allow in Security preferences)

### Linux
1. Download the Linux package
2. Extract the ZIP file
3. For AppImage: Make executable and run directly
4. For DEB: sudo dpkg -i scorpius.deb
5. For RPM: sudo rpm -i scorpius.rpm
6. Launch from applications menu or command line

## First Time Setup

1. Launch Scorpius
2. Enter your license key: SCORPIUS-ELITE-2024
3. Complete the initial configuration wizard
4. Start using the platform!

## Troubleshooting

### Common Issues

**Antivirus False Positive:**
- Some antivirus software may flag the application
- Add Scorpius to your antivirus whitelist
- This is a common issue with Electron applications

**Permission Errors (Windows):**
- Run as Administrator
- Check Windows Defender settings

**macOS Security Warning:**
- Go to System Preferences > Security & Privacy
- Click "Open Anyway" for Scorpius

**Linux Dependencies:**
- Install missing libraries: sudo apt install libnotify4 libnss3 libxss1

## Support

For technical support:
- Check the included documentation
- Visit our support portal
- Contact: support@scorpius-security.com

Enjoy using Scorpius Cybersecurity Dashboard!
`;

  const guidePath = path.join(PACKAGE_DIR, "INSTALLATION_GUIDE.txt");
  fs.writeFileSync(guidePath, installGuide.trim());
  log.info("Created installation guide");
}

// Build Electron packages
async function buildElectronPackages() {
  log.header("🚀 Building Electron packages for all platforms...");

  try {
    // Build the web app first
    log.info("Building web application...");
    execSync("npm run build", { stdio: "inherit" });
    log.success("Web application built successfully");

    // Build Electron packages
    log.info("Building Electron packages...");
    execSync("npm run electron-dist", { stdio: "inherit" });
    log.success("Electron packages built successfully");
  } catch (error) {
    log.error(`Build failed: ${error.message}`);
    process.exit(1);
  }
}

// Package for Gumroad
async function packageForGumroad() {
  log.header("📦 Creating Gumroad distribution packages...");

  ensurePackageDir();
  copyDocumentation();
  createLicenseFile();
  createInstallationGuide();

  // Check if dist-electron directory exists
  if (!fs.existsSync(DIST_ELECTRON_DIR)) {
    log.error(`Electron build directory not found: ${DIST_ELECTRON_DIR}`);
    log.info("Run the build process first with: npm run electron-dist");
    return;
  }

  const files = fs.readdirSync(DIST_ELECTRON_DIR);

  // Platform-specific file patterns
  const platforms = {
    windows: {
      patterns: [/\.exe$/, /\.exe\.blockmap$/],
      name: "Scorpius-Windows",
      description: "Windows installer and portable executable",
    },
    macos: {
      patterns: [/\.dmg$/, /-mac\.zip$/],
      name: "Scorpius-macOS",
      description: "macOS DMG installer and ZIP distribution",
    },
    linux: {
      patterns: [/\.AppImage$/, /\.deb$/, /\.rpm$/],
      name: "Scorpius-Linux",
      description: "Linux AppImage, DEB, and RPM packages",
    },
  };

  // Create platform-specific packages
  for (const [platformKey, platform] of Object.entries(platforms)) {
    const platformFiles = files.filter((file) =>
      platform.patterns.some((pattern) => pattern.test(file)),
    );

    if (platformFiles.length === 0) {
      log.warning(`No files found for ${platform.name}`);
      continue;
    }

    log.info(`Creating ${platform.name} package...`);
    log.info(`Files: ${platformFiles.join(", ")}`);

    // Create temporary directory for this platform
    const tempDir = path.join(PACKAGE_DIR, `temp-${platformKey}`);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });

    // Copy platform files
    platformFiles.forEach((file) => {
      const sourcePath = path.join(DIST_ELECTRON_DIR, file);
      const destPath = path.join(tempDir, file);
      fs.copyFileSync(sourcePath, destPath);
    });

    // Copy documentation to each platform package
    const docFiles = ["LICENSE.txt", "INSTALLATION_GUIDE.txt", "README.md"];
    docFiles.forEach((doc) => {
      const docPath = path.join(PACKAGE_DIR, doc);
      if (fs.existsSync(docPath)) {
        fs.copyFileSync(docPath, path.join(tempDir, doc));
      }
    });

    // Create ZIP package
    const zipPath = path.join(PACKAGE_DIR, `${platform.name}.zip`);
    await createZip(tempDir, zipPath, platform.name);

    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true });
  }

  // Create universal package with all platforms
  log.info("Creating universal package with all platforms...");
  const universalPath = path.join(PACKAGE_DIR, "Scorpius-All-Platforms.zip");
  await createZip(DIST_ELECTRON_DIR, universalPath, "All Platforms");

  log.success("All packages created successfully!");

  // Show final summary
  log.header("\n📋 Package Summary:");
  const packageFiles = fs.readdirSync(PACKAGE_DIR);
  packageFiles.forEach((file) => {
    if (file.endsWith(".zip")) {
      const stats = fs.statSync(path.join(PACKAGE_DIR, file));
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      log.info(`${file} - ${sizeMB} MB`);
    }
  });

  log.header("\n🎯 Next Steps:");
  log.info("1. Test each package on target platforms");
  log.info("2. Upload packages to Gumroad");
  log.info("3. Set up product descriptions and pricing");
  log.info("4. Configure download delivery");
  log.success(
    "\nYour Scorpius packages are ready for Gumroad distribution! 🚀",
  );
}

// Main execution
async function main() {
  try {
    log.header("🔥 SCORPIUS GUMROAD PACKAGE BUILDER 🔥");
    log.header("=====================================\n");

    await buildElectronPackages();
    await packageForGumroad();
  } catch (error) {
    log.error(`Package build failed: ${error.message}`);
    process.exit(1);
  }
}

// Install archiver if not present
try {
  require("archiver");
} catch (error) {
  log.warning("Installing required dependencies...");
  execSync("npm install archiver --save-dev", { stdio: "inherit" });
}

if (require.main === module) {
  main();
}

module.exports = { main, packageForGumroad };
