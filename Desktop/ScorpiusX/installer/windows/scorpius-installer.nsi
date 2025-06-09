; Scorpius Cybersecurity Platform - Windows Installer
; NSIS Installer Script for Professional GUI Setup Wizard

!define APP_NAME "Scorpius Cybersecurity Platform"
!define APP_VERSION "1.0.0"
!define APP_PUBLISHER "Scorpius Security"
!define APP_URL "https://scorpius-security.com"
!define APP_SUPPORT_URL "https://support.scorpius-security.com"
!define APP_UPDATES_URL "https://updates.scorpius-security.com"

; Installer properties
Name "${APP_NAME}"
OutFile "ScorpiusInstaller.exe"
InstallDir "$PROGRAMFILES64\${APP_NAME}"
InstallDirRegKey HKLM "Software\${APP_NAME}" "InstallDir"
RequestExecutionLevel admin
SetCompressor lzma

; Version Information
VIProductVersion "1.0.0.0"
VIAddVersionKey "ProductName" "${APP_NAME}"
VIAddVersionKey "CompanyName" "${APP_PUBLISHER}"
VIAddVersionKey "FileVersion" "${APP_VERSION}"
VIAddVersionKey "ProductVersion" "${APP_VERSION}"
VIAddVersionKey "FileDescription" "${APP_NAME} Installer"
VIAddVersionKey "LegalCopyright" "© 2024 ${APP_PUBLISHER}"

; Modern UI
!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "WinVer.nsh"

; Interface Settings
!define MUI_ABORTWARNING
!define MUI_ICON "assets\scorpius-icon.ico"
!define MUI_UNICON "assets\scorpius-icon.ico"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "assets\installer-header.bmp"
!define MUI_WELCOMEFINISHPAGE_BITMAP "assets\installer-welcome.bmp"

; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "assets\LICENSE.txt"
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
!define MUI_PAGE_CUSTOMFUNCTION_PRE PreInstallPage
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_RUN "$INSTDIR\Scorpius.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Launch ${APP_NAME}"
!define MUI_FINISHPAGE_SHOWREADME "$INSTDIR\README.txt"
!define MUI_FINISHPAGE_SHOWREADME_TEXT "View Quick Start Guide"
!insertmacro MUI_PAGE_FINISH

; Uninstaller pages
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; Languages
!insertmacro MUI_LANGUAGE "English"

; Custom variables
Var NodeJSDownloaded
Var PythonDownloaded
Var ElectronApp
Var WebApp

; Installer sections
Section "Core Application" SecCore
  SectionIn RO
  SetOutPath "$INSTDIR"
  
  ; Create application directory structure
  CreateDirectory "$INSTDIR\frontend"
  CreateDirectory "$INSTDIR\backend"
  CreateDirectory "$INSTDIR\electron"
  CreateDirectory "$INSTDIR\scripts"
  CreateDirectory "$INSTDIR\data"
  CreateDirectory "$INSTDIR\logs"
  
  ; Copy application files
  File /r "..\..\dist\*.*"
  File /r "..\..\backend\*.*"
  File /r "..\..\electron\*.*"
  File "..\..\package.json"
  File "..\..\README.md"
  File "assets\README.txt"
  
  ; Copy startup scripts
  File "scripts\startupscorpius.bat"
  File "scripts\ScorpiusLauncher.exe"
  
  ; Create main executable
  CopyFiles "$INSTDIR\scripts\ScorpiusLauncher.exe" "$INSTDIR\Scorpius.exe"
  
  ; Write registry keys
  WriteRegStr HKLM "Software\${APP_NAME}" "InstallDir" "$INSTDIR"
  WriteRegStr HKLM "Software\${APP_NAME}" "Version" "${APP_VERSION}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayName" "${APP_NAME}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "Publisher" "${APP_PUBLISHER}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayVersion" "${APP_VERSION}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "URLInfoAbout" "${APP_URL}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "HelpLink" "${APP_SUPPORT_URL}"
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "NoRepair" 1
  
  ; Create uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  
  ; Add to PATH
  EnVar::SetHKLM
  EnVar::AddValue "PATH" "$INSTDIR\scripts"
  
SectionEnd

Section "Desktop Integration" SecDesktop
  ; Create desktop shortcut
  CreateShortcut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\Scorpius.exe" "" "$INSTDIR\Scorpius.exe" 0
  
  ; Create start menu shortcuts
  CreateDirectory "$SMPROGRAMS\${APP_NAME}"
  CreateShortcut "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk" "$INSTDIR\Scorpius.exe" "" "$INSTDIR\Scorpius.exe" 0
  CreateShortcut "$SMPROGRAMS\${APP_NAME}\Web Dashboard.lnk" "$INSTDIR\scripts\open-web-dashboard.bat"
  CreateShortcut "$SMPROGRAMS\${APP_NAME}\Quick Start Guide.lnk" "$INSTDIR\README.txt"
  CreateShortcut "$SMPROGRAMS\${APP_NAME}\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  
  ; Register file associations
  WriteRegStr HKCR ".scorpius" "" "ScorpiusProject"
  WriteRegStr HKCR "ScorpiusProject" "" "Scorpius Project File"
  WriteRegStr HKCR "ScorpiusProject\DefaultIcon" "" "$INSTDIR\Scorpius.exe,0"
  WriteRegStr HKCR "ScorpiusProject\shell\open\command" "" '"$INSTDIR\Scorpius.exe" "%1"'
  
SectionEnd

Section "Node.js Runtime" SecNodeJS
  DetailPrint "Checking Node.js installation..."
  
  ; Check if Node.js is already installed
  nsExec::ExecToStack 'node --version'
  Pop $0
  Pop $1
  
  ${If} $0 != 0
    DetailPrint "Node.js not found. Downloading and installing..."
    
    ; Download Node.js installer
    NSISdl::download "https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi" "$TEMP\nodejs-installer.msi"
    Pop $0
    
    ${If} $0 == "success"
      DetailPrint "Installing Node.js..."
      ExecWait 'msiexec /i "$TEMP\nodejs-installer.msi" /quiet /norestart'
      Delete "$TEMP\nodejs-installer.msi"
      StrCpy $NodeJSDownloaded "true"
    ${Else}
      MessageBox MB_OK "Failed to download Node.js. Please install manually from https://nodejs.org"
    ${EndIf}
  ${Else}
    DetailPrint "Node.js found: $1"
  ${EndIf}
  
SectionEnd

Section "Python Runtime" SecPython
  DetailPrint "Checking Python installation..."
  
  ; Check if Python is already installed
  nsExec::ExecToStack 'python --version'
  Pop $0
  Pop $1
  
  ${If} $0 != 0
    DetailPrint "Python not found. Downloading and installing..."
    
    ; Download Python installer
    NSISdl::download "https://www.python.org/ftp/python/3.11.7/python-3.11.7-amd64.exe" "$TEMP\python-installer.exe"
    Pop $0
    
    ${If} $0 == "success"
      DetailPrint "Installing Python..."
      ExecWait '"$TEMP\python-installer.exe" /quiet InstallAllUsers=1 PrependPath=1 Include_test=0'
      Delete "$TEMP\python-installer.exe"
      StrCpy $PythonDownloaded "true"
    ${Else}
      MessageBox MB_OK "Failed to download Python. Please install manually from https://python.org"
    ${EndIf}
  ${Else}
    DetailPrint "Python found: $1"
  ${EndIf}
  
SectionEnd

Section "Application Dependencies" SecDeps
  DetailPrint "Installing application dependencies..."
  
  ; Install Node.js dependencies
  SetOutPath "$INSTDIR"
  DetailPrint "Installing Node.js packages..."
  nsExec::ExecToLog 'npm install --production'
  
  ; Install Python dependencies
  SetOutPath "$INSTDIR\backend"
  DetailPrint "Installing Python packages..."
  nsExec::ExecToLog 'pip install -r requirements.txt'
  
  ; Build Electron app
  SetOutPath "$INSTDIR"
  DetailPrint "Building Electron application..."
  nsExec::ExecToLog 'npm run electron-dist'
  
SectionEnd

Section "Firewall Configuration" SecFirewall
  DetailPrint "Configuring Windows Firewall..."
  
  ; Add firewall rules for the application
  nsExec::ExecToLog 'netsh advfirewall firewall add rule name="Scorpius Backend" dir=in action=allow program="$INSTDIR\backend\start.py" enable=yes'
  nsExec::ExecToLog 'netsh advfirewall firewall add rule name="Scorpius Frontend" dir=in action=allow port=8080 protocol=TCP'
  nsExec::ExecToLog 'netsh advfirewall firewall add rule name="Scorpius API" dir=in action=allow port=8000 protocol=TCP'
  
SectionEnd

; Component descriptions
LangString DESC_SecCore ${LANG_ENGLISH} "Core application files and executables (required)"
LangString DESC_SecDesktop ${LANG_ENGLISH} "Desktop shortcuts and file associations"
LangString DESC_SecNodeJS ${LANG_ENGLISH} "Node.js runtime environment (required for frontend)"
LangString DESC_SecPython ${LANG_ENGLISH} "Python runtime environment (required for backend)"
LangString DESC_SecDeps ${LANG_ENGLISH} "Install application dependencies automatically"
LangString DESC_SecFirewall ${LANG_ENGLISH} "Configure Windows Firewall rules for network access"

!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SecCore} $(DESC_SecCore)
  !insertmacro MUI_DESCRIPTION_TEXT ${SecDesktop} $(DESC_SecDesktop)
  !insertmacro MUI_DESCRIPTION_TEXT ${SecNodeJS} $(DESC_SecNodeJS)
  !insertmacro MUI_DESCRIPTION_TEXT ${SecPython} $(DESC_SecPython)
  !insertmacro MUI_DESCRIPTION_TEXT ${SecDeps} $(DESC_SecDeps)
  !insertmacro MUI_DESCRIPTION_TEXT ${SecFirewall} $(DESC_SecFirewall)
!insertmacro MUI_FUNCTION_DESCRIPTION_END

; Pre-install page function
Function PreInstallPage
  ; Check system requirements
  ${IfNot} ${AtLeastWin10}
    MessageBox MB_OK "Windows 10 or later is required to run ${APP_NAME}."
    Abort
  ${EndIf}
  
  ; Check available disk space (minimum 2GB)
  ${GetRoot} "$INSTDIR" $0
  ${DriveSpace} "$0" "/D=F /S=M" $1
  ${If} $1 < 2048
    MessageBox MB_OK "At least 2GB of free disk space is required."
    Abort
  ${EndIf}
  
  ; Check RAM (minimum 4GB)
  System::Call "kernel32::GetPhysicallyInstalledSystemMemory(*l) i.r0"
  ${If} $0 < 4194304  ; 4GB in KB
    MessageBox MB_YESNO "Less than 4GB RAM detected. ${APP_NAME} may run slowly. Continue anyway?" IDYES +2
    Abort
  ${EndIf}
  
FunctionEnd

; Post-install function
Function .onInstSuccess
  ; Create initial configuration
  FileOpen $0 "$INSTDIR\data\first-run.flag" w
  FileWrite $0 "true"
  FileClose $0
  
  ; Create quick start script
  FileOpen $0 "$INSTDIR\quick-start.bat" w
  FileWrite $0 "@echo off$\r$\n"
  FileWrite $0 "echo Starting Scorpius Cybersecurity Platform...$\r$\n"
  FileWrite $0 "cd /d $\"$INSTDIR$\"$\r$\n"
  FileWrite $0 "call scripts\startupscorpius.bat$\r$\n"
  FileClose $0
  
  MessageBox MB_OK "Installation completed successfully! Use 'startupscorpius' command or click the desktop shortcut to launch."
  
FunctionEnd

; Uninstaller
Section "Uninstall"
  ; Stop any running processes
  nsExec::ExecToLog 'taskkill /F /IM Scorpius.exe'
  nsExec::ExecToLog 'taskkill /F /IM node.exe'
  nsExec::ExecToLog 'taskkill /F /IM python.exe'
  
  ; Remove firewall rules
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="Scorpius Backend"'
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="Scorpius Frontend"'
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="Scorpius API"'
  
  ; Remove files
  RMDir /r "$INSTDIR"
  
  ; Remove shortcuts
  Delete "$DESKTOP\${APP_NAME}.lnk"
  RMDir /r "$SMPROGRAMS\${APP_NAME}"
  
  ; Remove registry keys
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}"
  DeleteRegKey HKLM "Software\${APP_NAME}"
  DeleteRegKey HKCR ".scorpius"
  DeleteRegKey HKCR "ScorpiusProject"
  
  ; Remove from PATH
  EnVar::SetHKLM
  EnVar::DeleteValue "PATH" "$INSTDIR\scripts"
  
SectionEnd
