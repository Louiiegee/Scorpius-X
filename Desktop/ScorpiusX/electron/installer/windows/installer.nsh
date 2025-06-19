; Scorpius Cybersecurity Dashboard Windows Installer Script
; Custom NSIS installer configuration for Windows deployment

!macro customInstall
  ; Create desktop shortcut with custom icon
  CreateShortCut "$DESKTOP\Scorpius Cybersecurity Dashboard.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" 0

  ; Create start menu shortcuts
  CreateDirectory "$SMPROGRAMS\Scorpius Security"
  CreateShortCut "$SMPROGRAMS\Scorpius Security\Scorpius Cybersecurity Dashboard.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" 0
  CreateShortCut "$SMPROGRAMS\Scorpius Security\Uninstall Scorpius.lnk" "$INSTDIR\Uninstall ${PRODUCT_FILENAME}.exe"

  ; Add to Windows Programs list
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "DisplayName" "Scorpius Cybersecurity Dashboard"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "DisplayIcon" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "Publisher" "Scorpius Security"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "URLInfoAbout" "https://scorpius.security"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "InstallLocation" "$INSTDIR"

  ; Register protocol handler for scorpius:// URLs
  WriteRegStr HKCR "scorpius" "" "URL:Scorpius Protocol"
  WriteRegStr HKCR "scorpius" "URL Protocol" ""
  WriteRegStr HKCR "scorpius\DefaultIcon" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME},1"
  WriteRegStr HKCR "scorpius\shell\open\command" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" "%1"'

  ; Set file associations for Scorpius project files
  WriteRegStr HKCR ".scorpius" "" "ScorpiusProject"
  WriteRegStr HKCR "ScorpiusProject" "" "Scorpius Project File"
  WriteRegStr HKCR "ScorpiusProject\DefaultIcon" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME},0"
  WriteRegStr HKCR "ScorpiusProject\shell\open\command" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" "%1"'

  ; Windows Defender exclusion (optional, requires admin)
  ; ExecWait 'powershell -Command "Add-MpPreference -ExclusionPath \"$INSTDIR\""'
!macroend

!macro customUnInstall
  ; Remove desktop shortcut
  Delete "$DESKTOP\Scorpius Cybersecurity Dashboard.lnk"

  ; Remove start menu shortcuts
  Delete "$SMPROGRAMS\Scorpius Security\Scorpius Cybersecurity Dashboard.lnk"
  Delete "$SMPROGRAMS\Scorpius Security\Uninstall Scorpius.lnk"
  RMDir "$SMPROGRAMS\Scorpius Security"

  ; Remove registry entries
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
  DeleteRegKey HKCR "scorpius"
  DeleteRegKey HKCR ".scorpius"
  DeleteRegKey HKCR "ScorpiusProject"

  ; Clean up application data (optional)
  ; RMDir /r "$APPDATA\scorpius-cybersecurity-dashboard"
!macroend

!macro customHeader
  ; Custom installer header
  !define MUI_HEADERIMAGE
  !define MUI_HEADERIMAGE_BITMAP "${BUILD_RESOURCES_DIR}\installer-header.bmp"
  !define MUI_WELCOMEFINISHPAGE_BITMAP "${BUILD_RESOURCES_DIR}\installer-wizard.bmp"
  !define MUI_UNWELCOMEFINISHPAGE_BITMAP "${BUILD_RESOURCES_DIR}\installer-wizard.bmp"
!macroend

; Custom installer pages
!macro customWelcomePage
  ; Add custom welcome text
  !define MUI_WELCOMEPAGE_TEXT "This wizard will guide you through the installation of Scorpius Cybersecurity Dashboard.$\r$\n$\r$\nScorpius is an advanced cybersecurity platform providing comprehensive blockchain security analysis, smart contract vulnerability scanning, and real-time threat detection.$\r$\n$\r$\nClick Next to continue."
!macroend

; Post-installation launch options
!macro customFinishPage
  !define MUI_FINISHPAGE_RUN "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
  !define MUI_FINISHPAGE_RUN_TEXT "Launch Scorpius Cybersecurity Dashboard"
  !define MUI_FINISHPAGE_LINK "Visit Scorpius Security website"
  !define MUI_FINISHPAGE_LINK_LOCATION "https://scorpius.security"
!macroend
