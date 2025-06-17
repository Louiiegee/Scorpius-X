# 🎯 Scorpius Platform - Future Access Guide

## 🚀 Easiest Ways to Get Back Into Scorpius

### 🖱️ **Double-Click Options (Easiest)**

1. **`Launch-Web.bat`** → Web dashboard opens in browser
2. **`Launch-Desktop.bat`** → Native desktop app launches  
3. **`Launch-Scorpius.bat`** → Full menu with all options
4. **`Quick-Status.ps1`** → Check what's currently running

### 💻 **Command Line (For Power Users)**

Open PowerShell in this folder and run:

```powershell
# Quick launches
.\Start-Scorpius.ps1 -Mode web       # Web dashboard
.\Start-Scorpius.ps1 -Mode electron  # Desktop app
.\Start-Scorpius.ps1 -Mode status    # Check status

# Interactive menu (no parameters)
.\Start-Scorpius.ps1                 # Shows numbered menu
```

### 🖥️ **Desktop Shortcuts (Optional)**

Run once to create desktop shortcuts:
```powershell
.\Create-Desktop-Shortcuts.ps1
```

This creates clickable shortcuts on your desktop for even easier access.

## 🌐 **Access URLs Once Running**

- **Main Interface**: http://localhost
- **Direct Frontend**: http://localhost:3002  
- **Backend API**: http://localhost:3001
- **API Health**: http://localhost:3001/health

## ⏱️ **Typical Startup Time**

- **Web Dashboard**: ~30-45 seconds
- **Desktop App**: ~30-45 seconds  
- **Status Check**: ~2-3 seconds
- **Full Platform**: ~60-90 seconds

## 🔧 **If Things Go Wrong**

1. **Check Status**: Run `Quick-Status.ps1` or `.\Start-Scorpius.ps1 -Mode status`
2. **Restart Docker**: Close Docker Desktop, reopen it
3. **Stop Everything**: `.\scripts\start-scorpius.ps1 -Stop`
4. **Fresh Start**: Wait 30 seconds, then use your preferred launch method

## 📋 **What Each Mode Includes**

| Mode | Services | Best For |
|------|----------|----------|
| **Web** | Backend + Frontend + Database | General use, demos |
| **Electron** | Backend + Dev Server + Desktop App | Development, power users |
| **Backend** | API + Database only | Testing APIs |
| **Full** | Everything + Nginx + Cache | Production-like |

## 💡 **Pro Tips**

- **Bookmark this folder** for quick access
- **Use Web mode** for fastest startup and best compatibility
- **Use Desktop mode** when you want native app experience
- **Check status first** if unsure what's running
- **Web dashboard works in any browser** (Chrome, Firefox, Edge, Safari)

---

**🎉 That's it! You're all set for easy future access to Scorpius!**

*Next time you want to use Scorpius, just double-click `Launch-Web.bat` or `Launch-Desktop.bat` and you'll be up and running in under a minute.*
