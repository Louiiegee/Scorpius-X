# 🚀 Scorpius Electron Desktop App

Your Scorpius Cybersecurity Dashboard now includes a complete **Electron desktop application** that provides an identical experience to the web interface with enhanced desktop features!

## ✨ What's New

- 🖥️ **Native Desktop App** - Standalone application for Windows, macOS, and Linux
- 🎛️ **Window Controls** - Minimize, maximize, close from within the app
- 📊 **System Monitoring** - Real-time CPU and memory usage tracking
- 🔔 **Desktop Notifications** - Native system alerts and notifications
- ⚡ **Enhanced Performance** - Direct system API access for better performance
- 🎯 **Cross-Platform** - Works on all major operating systems

## 🚀 Quick Start Commands

### Start Everything at Once (Recommended)

```bash
# Start backend, frontend, and Electron app simultaneously
npm run start-all
```

This single command will:

1. Start the FastAPI backend server on `http://localhost:8000`
2. Start the Vite development server on `http://localhost:8080`
3. Launch the Electron desktop application
4. Display real-time status for all services

### Individual Service Commands

```bash
# Just the Electron app (requires frontend to be running)
npm run electron

# Development with hot reload
npm run electron-dev

# Build and run production Electron app
npm run build && npm run electron
```

## 🖥️ Desktop Features

### Electron Enhanced Widget

When running in Electron, you'll see a special **Electron Enhanced Widget** in the top-right corner featuring:

- **Window Controls**: Minimize, maximize, close buttons
- **System Information**: Platform, architecture, CPU count
- **Performance Monitoring**: Real-time CPU and memory usage
- **Frame Rate Display**: Live FPS counter
- **Desktop Notifications**: Test native notification system
- **Version Information**: Electron, Chrome, and Node.js versions

### Native Capabilities

- **System Integration**: Access to native APIs for enhanced functionality
- **Better Security**: Context isolation and secure preload scripts
- **Offline Support**: Works without internet connection
- **File System Access**: Enhanced file handling capabilities
- **Platform Detection**: Automatic adaptation to Windows/macOS/Linux

## 🛠️ Building Installers

### For Current Platform

```bash
npm run electron-dist
```

### For All Platforms (Advanced)

```bash
# Windows (from Windows machine)
npm run electron-build -- --win

# macOS (from macOS machine)
npm run electron-build -- --mac

# Linux (from Linux machine)
npm run electron-build -- --linux
```

Built installers will be in the `dist-electron/` directory.

## 📂 Project Structure

```
electron/
├── main.js              # Main Electron process
├── preload.js           # Secure preload script
├── entitlements.mac.plist # macOS code signing
└── assets/
    ├── icon.png         # App icon (Linux)
    ├── icon.ico         # App icon (Windows)
    ├── icon.icns        # App icon (macOS)
    └── README.md        # Icon requirements

src/components/
└── ElectronEnhancedWidget.tsx # Desktop features widget

electron-builder.json    # Build configuration
start-all.js            # Unified startup script
```

## 🎨 Visual Consistency

The Electron app maintains **100% visual consistency** with the web version:

- ✅ Identical styling and animations
- ✅ Same cyberpunk color scheme
- ✅ All UI components work identically
- ✅ Responsive design preserved
- ✅ All functionality available

The only difference is the additional **Electron Enhanced Widget** that provides desktop-specific features.

## 🔧 Configuration

### Customizing the App

Edit `electron/main.js` to modify:

- Window size and minimum dimensions
- Security settings
- Development tools behavior
- Background color and styling

Edit `electron-builder.json` to customize:

- App metadata (name, description, version)
- Platform-specific build options
- Installer appearance and behavior
- Code signing certificates

### Adding Your Branding

1. Replace icons in `electron/assets/`:

   - `icon.png` (1024x1024) for Linux
   - `icon.ico` (multi-size) for Windows
   - `icon.icns` (multi-size) for macOS

2. Update app metadata in `electron-builder.json`:
   - `appId`: Your unique app identifier
   - `productName`: Display name
   - `copyright`: Your copyright notice

## 🔒 Security Features

- **Context Isolation**: Renderer process is isolated from Node.js
- **Secure Preload**: Limited API exposure through secure context bridge
- **Content Security Policy**: Prevents code injection attacks
- **External Link Protection**: Opens external links in default browser
- **Certificate Validation**: Proper SSL/TLS handling

## 🚨 Troubleshooting

### Port Already in Use

If you get port conflicts:

```bash
# Kill processes on the ports
npx kill-port 8000 8080

# Or use different ports by editing start-all.js CONFIG section
```

### Electron Won't Start

1. Make sure the frontend is running first
2. Check that http://localhost:8080 is accessible
3. Try `npm run electron-dev` for debugging output

### Missing Dependencies

```bash
# Reinstall all dependencies
npm install

# Install Electron dependencies specifically
npm install --save-dev electron electron-builder concurrently wait-on
```

### Performance Issues

- Close unnecessary applications
- Check system resources in the Electron Enhanced Widget
- Use `npm run build && npm run electron` for production performance

## 📱 Platform-Specific Notes

### Windows

- Generates NSIS installer and portable executable
- Supports Windows 10/11
- Includes Windows defender exclusion helper

### macOS

- Generates DMG installer and ZIP distribution
- Supports Intel and Apple Silicon
- Requires developer certificate for distribution

### Linux

- Generates AppImage, DEB, and RPM packages
- Works on Ubuntu, Debian, Fedora, and others
- Includes desktop file for app launcher integration

## 🎯 Next Steps

1. **Customize Branding**: Add your own icons and app metadata
2. **Test Builds**: Create installers for your target platforms
3. **Add Features**: Extend the ElectronEnhancedWidget with more capabilities
4. **Setup Auto-Updates**: Configure automatic update delivery
5. **Distribution**: Publish to app stores or distribute directly

## 🆘 Support

If you encounter any issues:

1. Check the browser dev tools (F12) for errors
2. Check the terminal output for service status
3. Verify all dependencies are installed
4. Try restarting with `npm run start-all`

The **Electron Enhanced Widget** also provides real-time system information to help diagnose performance issues.

---

🎉 **Your Scorpius Dashboard is now a full-featured desktop application!**

The unified startup script makes it incredibly easy to get everything running with a single command. Just run `npm run start-all` and you'll have the complete platform running in seconds!
