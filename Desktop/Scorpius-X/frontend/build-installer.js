#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

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

async function buildInstaller() {
  try {
    log.header("🔥 SCORPIUS INSTALLER BUILDER 🔥");
    log.header("====================================");

    // Step 1: Build the application
    log.info("Building Scorpius application...");
    execSync("npm run build", { stdio: "inherit" });
    log.success("Application built successfully");

    // Step 2: Build Electron distributables
    log.info("Building Electron packages...");
    execSync("npm run electron-dist", { stdio: "inherit" });
    log.success("Electron packages built");

    // Step 3: Create installer directories
    log.info("Setting up installer directories...");
    const installerDirs = [
      "installer/windows/assets",
      "installer/windows/scripts",
      "installer/output",
      "dist-installer",
    ];

    installerDirs.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Step 4: Copy necessary files for installer
    log.info("Copying files for installer...");

    // Copy startup scripts
    if (!fs.existsSync("installer/windows/scripts/startupscorpius.bat")) {
      fs.copyFileSync(
        "scripts/startupscorpius.bat",
        "installer/windows/scripts/startupscorpius.bat",
      );
    }

    // Create launcher executable (placeholder)
    const launcherPath = "installer/windows/scripts/ScorpiusLauncher.exe";
    if (!fs.existsSync(launcherPath)) {
      log.warning(
        "ScorpiusLauncher.exe not found. You need to compile the C# launcher.",
      );
      log.info("Compiling C# launcher is required for production installer.");
      // For now, create a batch file as launcher
      fs.writeFileSync(
        "installer/windows/scripts/ScorpiusLauncher.bat",
        `@echo off
cd /d "%~dp0..\\..\\..\\..
call scripts\\startupscorpius.bat
`,
      );
    }

    // Step 5: Create installer assets
    log.info("Creating installer assets...");

    // Create README for installer
    fs.writeFileSync(
      "installer/windows/assets/README.txt",
      `
Scorpius Cybersecurity Platform - Quick Start Guide
==================================================

🚀 GETTING STARTED:

1. AUTOMATIC STARTUP:
   - Use the desktop shortcut or Start Menu
   - OR type 'startupscorpius' in any command prompt
   - The platform will auto-start all services

2. ACCESSING THE PLATFORM:
   - Web Dashboard: http://localhost:8080
   - Desktop App: Launches automatically
   - API Documentation: http://localhost:8000/docs

3. FIRST TIME SETUP:
   - Enter license key: SCORPIUS-ELITE-2024
   - Create your login credentials
   - Start exploring the cybersecurity features

4. SYSTEM REQUIREMENTS:
   - Windows 10/11 (64-bit)
   - 4GB RAM minimum (8GB recommended)
   - 2GB free disk space
   - Internet connection for live data

5. TROUBLESHOOTING:
   - Check Windows Firewall settings
   - Ensure ports 8000 and 8080 are available
   - Run as Administrator if needed
   - Contact support: support@scorpius-security.com

🔥 FEATURES INCLUDED:
   ✅ Smart Contract Vulnerability Scanner
   ✅ MEV Operations Manager  
   ✅ Real-Time Mempool Monitor
   ✅ TrapGrid Honeypot Detection
   ✅ Time Machine Attack Analysis
   ✅ Bug Bounty Program
   ✅ Training Academy
   ✅ Intel Reports & Analytics
   ✅ Task Scheduler
   ✅ System Health Monitoring

For complete documentation, visit: https://docs.scorpius-security.com
`,
    );

    // Create license file
    fs.writeFileSync(
      "installer/windows/assets/LICENSE.txt",
      `
END USER LICENSE AGREEMENT
Scorpius Cybersecurity Platform

Copyright © 2024 Scorpius Security

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
`,
    );

    // Step 6: Create global command installer
    log.info("Creating global command installer...");

    const globalCommandScript = `@echo off
REM Global Scorpius Startup Command Installer

echo Installing 'startupscorpius' global command...

REM Get installation directory
set "INSTALL_DIR=%PROGRAMFILES%\\Scorpius Cybersecurity Platform"

REM Check if installed
if not exist "%INSTALL_DIR%\\scripts\\startupscorpius.bat" (
    echo Error: Scorpius not found in expected location.
    echo Please install Scorpius first or run from installation directory.
    pause
    exit /b 1
)

REM Add to PATH if not already present
echo %PATH% | findstr /i "%INSTALL_DIR%\\scripts" >nul
if errorlevel 1 (
    echo Adding Scorpius to PATH...
    setx PATH "%PATH%;%INSTALL_DIR%\\scripts" /M
    echo Global command installed successfully!
    echo You can now use 'startupscorpius' from any command prompt.
) else (
    echo Global command already installed.
)

echo.
echo Usage: Open any command prompt and type 'startupscorpius'
pause
`;

    fs.writeFileSync(
      "installer/windows/install-global-command.bat",
      globalCommandScript,
    );

    // Step 7: Build the final installer package
    log.info("Creating final installer package...");

    const packageFiles = [
      "dist/**/*",
      "backend/**/*",
      "electron/**/*",
      "scripts/**/*",
      "package.json",
      "README.md",
      "installer/windows/scripts/**/*",
      "installer/windows/assets/**/*",
    ];

    // Create distribution structure
    const distDir = "dist-installer/ScorpiusInstaller";
    if (fs.existsSync(distDir)) {
      fs.rmSync(distDir, { recursive: true });
    }
    fs.mkdirSync(distDir, { recursive: true });

    // Copy all necessary files
    execSync(`xcopy /E /I /Y dist "${distDir}\\dist"`, { stdio: "inherit" });
    execSync(`xcopy /E /I /Y backend "${distDir}\\backend"`, {
      stdio: "inherit",
    });
    execSync(`xcopy /E /I /Y electron "${distDir}\\electron"`, {
      stdio: "inherit",
    });
    execSync(`xcopy /E /I /Y scripts "${distDir}\\scripts"`, {
      stdio: "inherit",
    });
    fs.copyFileSync("package.json", `${distDir}/package.json`);
    fs.copyFileSync("README.md", `${distDir}/README.md`);

    // Copy installer files
    execSync(
      `xcopy /E /I /Y "installer\\windows\\scripts" "${distDir}\\installer-scripts"`,
      { stdio: "inherit" },
    );
    execSync(
      `xcopy /E /I /Y "installer\\windows\\assets" "${distDir}\\installer-assets"`,
      { stdio: "inherit" },
    );

    // Create setup script
    const setupScript = `@echo off
echo 🔥 SCORPIUS CYBERSECURITY PLATFORM SETUP 🔥
echo ============================================
echo.

REM Check admin rights
net session >nul 2>&1
if not %errorLevel% == 0 (
    echo This installer requires administrator privileges.
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo Installing Scorpius Cybersecurity Platform...
echo.

REM Copy files to Program Files
set "INSTALL_DIR=%PROGRAMFILES%\\Scorpius Cybersecurity Platform"
if exist "%INSTALL_DIR%" (
    echo Removing previous installation...
    rmdir /s /q "%INSTALL_DIR%"
)

echo Creating installation directory...
mkdir "%INSTALL_DIR%"

echo Copying application files...
xcopy /E /I /Y "*" "%INSTALL_DIR%\\"

REM Create desktop shortcut
echo Creating desktop shortcut...
powershell "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\\Desktop\\Scorpius Platform.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\\scripts\\startupscorpius.bat'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.IconLocation = '%INSTALL_DIR%\\installer-assets\\scorpius-icon.ico'; $Shortcut.Save()"

REM Create start menu shortcut
echo Creating start menu shortcut...
mkdir "%PROGRAMDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Scorpius Security"
powershell "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%PROGRAMDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Scorpius Security\\Scorpius Platform.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\\scripts\\startupscorpius.bat'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.IconLocation = '%INSTALL_DIR%\\installer-assets\\scorpius-icon.ico'; $Shortcut.Save()"

REM Add to PATH
echo Adding to system PATH...
setx PATH "%PATH%;%INSTALL_DIR%\\scripts" /M

REM Create uninstaller
echo Creating uninstaller...
(
echo @echo off
echo echo Uninstalling Scorpius Cybersecurity Platform...
echo rmdir /s /q "%INSTALL_DIR%"
echo del "%USERPROFILE%\\Desktop\\Scorpius Platform.lnk"
echo rmdir /s /q "%PROGRAMDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Scorpius Security"
echo echo Uninstallation complete.
echo pause
) > "%INSTALL_DIR%\\Uninstall.bat"

echo.
echo ✅ Installation completed successfully!
echo.
echo 🚀 To start Scorpius:
echo   - Use the desktop shortcut
echo   - OR type 'startupscorpius' in any command prompt
echo   - OR use the Start Menu shortcut
echo.
echo 📖 License Key: SCORPIUS-ELITE-2024
echo.
pause
`;

    fs.writeFileSync(`${distDir}/SETUP.bat`, setupScript);

    // Create ZIP package
    log.info("Creating ZIP installer package...");
    execSync(
      `powershell Compress-Archive -Path "${distDir}\\*" -DestinationPath "dist-installer\\Scorpius-Windows-Installer.zip" -Force`,
      { stdio: "inherit" },
    );

    log.success(
      "Windows installer package created: dist-installer/Scorpius-Windows-Installer.zip",
    );

    // Step 8: Create cross-platform startup installers
    log.info("Creating cross-platform startup scripts...");

    // Make scripts executable
    if (fs.existsSync("scripts/startupscorpius.sh")) {
      try {
        execSync("chmod +x scripts/startupscorpius.sh");
      } catch (e) {
        log.warning("Could not make Linux script executable (Windows system)");
      }
    }

    log.header("📋 INSTALLER BUILD SUMMARY:");
    log.success("✅ Application built and packaged");
    log.success("✅ Windows installer created");
    log.success("✅ Global command scripts ready");
    log.success("✅ Cross-platform startup scripts included");

    log.header("\n🎯 DISTRIBUTION FILES:");
    log.info(
      "📦 Windows Installer: dist-installer/Scorpius-Windows-Installer.zip",
    );
    log.info("🔧 Global Command: installer/windows/install-global-command.bat");
    log.info(
      "💻 Startup Scripts: scripts/startupscorpius.bat (Windows), scripts/startupscorpius.sh (Linux/Mac)",
    );

    log.header("\n📖 USAGE INSTRUCTIONS:");
    log.info(
      "1. For GUI Installation: Extract and run SETUP.bat as Administrator",
    );
    log.info(
      '2. For Command Line: Copy scripts and use "startupscorpius" command',
    );
    log.info("3. License Key: SCORPIUS-ELITE-2024");

    log.header("\n🚀 Your Scorpius installer is ready for distribution!");
  } catch (error) {
    log.error(`Installer build failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  buildInstaller();
}

module.exports = { buildInstaller };
