# Scorpius Cybersecurity Dashboard - Windows Deployment Guide

## 🚀 Quick Start for Windows

### Prerequisites

- Windows 10/11 (64-bit recommended)
- Node.js 18+ and npm installed
- Git (optional, for source updates)

### Easy Build (Double-click method)

1. **Double-click `build-windows.bat`** - This will automatically:
   - Install dependencies
   - Build the React app
   - Create Windows executable
   - Open the output folder

### Manual Build Process

```cmd
# Install dependencies
npm install

# Build the web application
npm run build

# Build Windows executable and installer
npm run electron-build-win

# Or build specific formats:
npm run electron-build-win-installer  # Creates .exe installer
npm run electron-build-win-portable   # Creates portable .exe
```

## 📦 Output Files

After building, you'll find these files in `dist-electron/`:

### Installer (.exe)

- **File**: `Scorpius-Cybersecurity-Dashboard-1.0.0-Windows-x64.exe`
- **Size**: ~150-200 MB
- **Features**:
  - Full Windows installer with NSIS
  - Desktop shortcuts
  - Start menu integration
  - File associations
  - Uninstaller included
  - Auto-update capability (future)

### Portable (.zip)

- **File**: `Scorpius-Cybersecurity-Dashboard-1.0.0-Windows-x64.zip`
- **Size**: ~150-200 MB
- **Features**:
  - No installation required
  - Extract and run anywhere
  - Perfect for USB drives
  - No registry changes

## 🛠️ Development Mode

### Quick Development (Double-click method)

1. **Double-click `dev-windows.bat`** - This will:
   - Start the web server on http://localhost:8080
   - Launch Electron app automatically
   - Keep both running for development

### Manual Development

```cmd
# Terminal 1: Start web server
npm run dev

# Terminal 2: Start Electron app
npm run electron
```

## 🎨 Windows-Specific Features

### Visual Integration

- ✅ Custom Windows icon (when icon.ico provided)
- ✅ Frameless window design matching web version
- ✅ Windows 11 rounded corners support
- ✅ Proper taskbar integration
- ✅ Windows notifications support

### System Integration

- ✅ Start menu shortcuts
- ✅ Desktop shortcuts
- ✅ File associations (.scorpius files)
- ✅ Protocol handler (scorpius:// URLs)
- ✅ Windows Defender compatibility
- ✅ Power management (sleep/wake handling)

### Security Features

- ✅ Code signing ready (certificate required)
- ✅ Windows SmartScreen compatible
- ✅ UAC elevation when needed
- ✅ Secure auto-updater ready

## 🔧 Customization

### Adding Custom Icons

1. Create `electron/assets/icon.ico` (256x256, multi-resolution)
2. Add installer graphics:
   - `installer-header.bmp` (150x57 pixels)
   - `installer-wizard.bmp` (164x314 pixels)
3. Rebuild with `npm run electron-build-win`

### Installer Customization

Edit `electron/installer/windows/installer.nsh` to customize:

- Installation options
- Registry entries
- File associations
- Post-install actions

### App Configuration

Edit `electron-builder.json` to modify:

- App metadata
- Windows-specific settings
- Installer behavior
- Code signing options

## 📋 System Requirements

### Minimum Requirements

- **OS**: Windows 10 (version 1903+)
- **CPU**: x64 processor, 1 GHz
- **RAM**: 4 GB
- **Storage**: 500 MB free space
- **Display**: 1024x768 resolution

### Recommended Requirements

- **OS**: Windows 11
- **CPU**: Multi-core x64 processor, 2+ GHz
- **RAM**: 8 GB or more
- **Storage**: 1 GB free space (SSD preferred)
- **Display**: 1920x1080 or higher
- **Network**: Internet connection for updates

## 🔐 Code Signing (Optional)

For production deployment, add code signing:

1. **Get a Code Signing Certificate**

   - From DigiCert, Sectigo, or other CA
   - EV certificates recommended for instant trust

2. **Configure Signing**

   ```json
   // In electron-builder.json
   "win": {
     "certificateFile": "path/to/certificate.p12",
     "certificatePassword": "certificate_password",
     "signAndEditExecutable": true,
     "signDlls": true
   }
   ```

3. **Build Signed Version**
   ```cmd
   npm run electron-build-win
   ```

## 🚨 Troubleshooting

### Common Issues

**"App won't start"**

- Check Windows version (10+ required)
- Run as administrator if needed
- Check antivirus software

**"Build fails"**

- Ensure Node.js 18+ installed
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall

**"Installer issues"**

- Run installer as administrator
- Disable antivirus temporarily
- Check disk space

**"Performance issues"**

- Close unnecessary background apps
- Check available RAM
- Update graphics drivers

### Getting Help

- Check console logs in DevTools (Ctrl+Shift+I)
- Look at Windows Event Viewer
- Check `%APPDATA%/scorpius-cybersecurity-dashboard/logs/`

## 📈 Deployment Checklist

Before distributing:

- [ ] Test on clean Windows 10/11 systems
- [ ] Verify installer works without admin rights
- [ ] Check antivirus false positive reports
- [ ] Test auto-updater functionality
- [ ] Validate code signing certificate
- [ ] Test uninstaller thoroughly
- [ ] Verify desktop/start menu shortcuts
- [ ] Check file associations work
- [ ] Test on different screen resolutions
- [ ] Performance test on minimum requirements

## 🎯 Distribution Options

### Direct Download

- Host installer on your website
- Provide checksums for verification
- Include installation instructions

### Microsoft Store (Future)

- Package as MSIX for Store distribution
- Automatic updates via Store
- Enhanced security and sandboxing

### Enterprise Deployment

- MSI packages for Group Policy
- Silent installation options
- Centralized configuration management

---

## 🔗 Quick Links

- **Build Now**: Double-click `build-windows.bat`
- **Develop**: Double-click `dev-windows.bat`
- **Manual Build**: `npm run electron-build-win`
- **Installer Only**: `npm run electron-build-win-installer`
- **Portable Only**: `npm run electron-build-win-portable`

**Ready to deploy your cybersecurity dashboard on Windows! 🛡️**
