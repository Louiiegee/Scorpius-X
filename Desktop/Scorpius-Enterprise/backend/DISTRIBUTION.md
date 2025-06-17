# Scorpius X - Distribution Guide

This guide explains how to develop, build, and distribute the Scorpius X application.

## Development

### Prerequisites

1. Node.js (v16+)
2. Python (v3.9+)
3. Git

### Setup Development Environment

1. Install frontend dependencies:
   ```bash
   cd new-dash-main
   npm install
   ```

2. Install backend dependencies:
   ```bash
   cd "../NEW SCORPIUS X/backend"
   pip install -r requirements.txt
   ```

3. Start the development servers:
   ```bash
   cd ../../new-dash-main
   npm run electron:dev
   ```

This will start:
- The React frontend (Vite)
- The Python backend servers (FastAPI and WebSocket)
- The Electron application

## Building for Distribution

### Create a Production Build

Run the full build script:

```bash
cd new-dash-main
node scripts/build-all.js
```

This will:
1. Build the React frontend
2. Package the Python backend
3. Build the Electron application for your platform

### Output

The distributable packages will be available in the `release` folder:
- Windows: `release/Scorpius X Setup x.x.x.exe`
- macOS: `release/Scorpius X-x.x.x.dmg`
- Linux: `release/scorpius-x-x.x.x.AppImage`

## Customizing the Build

You can customize the build process in:
- `package.json`: Update the `build` section for Electron Builder options
- `electron/main.js`: Modify the Electron main process
- `scripts/package-backend.js`: Adjust Python backend packaging

## Requirements for Distribution

### Windows

- Windows 10/11 (64-bit)
- No additional runtime requirements (all dependencies included)

### macOS

- macOS 10.14+ (Mojave or later)
- x86_64 or arm64 architecture

### Linux

- Recent Linux distribution (Ubuntu 20.04+, Fedora 32+, etc.)
- Required libraries: libgtk-3, libnotify, libgbm