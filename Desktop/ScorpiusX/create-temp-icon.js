/**
 * Temporary Icon Creator for Scorpius Cybersecurity Dashboard
 * Creates a basic icon file structure for Windows build
 */

const fs = require("fs");
const path = require("path");

// Create assets directory if it doesn't exist
const assetsDir = path.join(__dirname, "electron", "assets");
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Create a simple SVG icon that can be converted to ICO
const svgIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <!-- Background Circle -->
  <circle cx="128" cy="128" r="120" fill="#000000" stroke="#00ffff" stroke-width="4"/>
  
  <!-- Shield Shape -->
  <path d="M128 40 L180 70 L180 130 Q180 160 128 200 Q76 160 76 130 L76 70 Z" 
        fill="#001122" stroke="#00ffff" stroke-width="2"/>
  
  <!-- Inner Shield Pattern -->
  <path d="M128 60 L160 80 L160 120 Q160 140 128 170 Q96 140 96 120 L96 80 Z" 
        fill="#002244" stroke="#00cccc" stroke-width="1"/>
  
  <!-- Scorpius Symbol -->
  <circle cx="128" cy="110" r="8" fill="#00ffff"/>
  <path d="M128 120 L128 140 M120 135 L136 135" stroke="#00ffff" stroke-width="3" stroke-linecap="round"/>
  
  <!-- Tech Lines -->
  <line x1="100" y1="90" x2="156" y2="90" stroke="#00ffff" stroke-width="1" opacity="0.6"/>
  <line x1="104" y1="100" x2="152" y2="100" stroke="#00ffff" stroke-width="1" opacity="0.4"/>
  <line x1="108" y1="150" x2="148" y2="150" stroke="#00ffff" stroke-width="1" opacity="0.4"/>
  
  <!-- Corner Accents -->
  <circle cx="80" cy="80" r="3" fill="#00ffff" opacity="0.8"/>
  <circle cx="176" cy="80" r="3" fill="#00ffff" opacity="0.8"/>
  <circle cx="80" cy="176" r="3" fill="#00ffff" opacity="0.8"/>
  <circle cx="176" cy="176" r="3" fill="#00ffff" opacity="0.8"/>
</svg>`;

// Save SVG icon
const svgPath = path.join(assetsDir, "icon.svg");
fs.writeFileSync(svgPath, svgIcon);

console.log("✅ Created temporary SVG icon:", svgPath);

// Create icon info file
const iconInfo = `# TEMPORARY ICON CREATED

This is a temporary SVG icon for the Scorpius Cybersecurity Dashboard.

## To use a proper Windows icon (.ico):

1. Convert the SVG to ICO format using:
   - Online: favicon.io, convertio.co
   - Desktop: GIMP, Photoshop, Inkscape
   - Command line: ImageMagick

2. Save as 'icon.ico' in this folder

3. The ICO file should contain multiple sizes:
   - 256x256 (primary)
   - 128x128
   - 64x64
   - 48x48
   - 32x32
   - 16x16

## Current Status:
- ✅ SVG icon created (temporary)
- ⏳ ICO icon needed for Windows
- ⏳ Installer graphics needed

The Windows build will work with this temporary icon,
but a proper ICO file will look much better.
`;

fs.writeFileSync(path.join(assetsDir, "ICON_STATUS.md"), iconInfo);

console.log("✅ Created icon status file");
console.log("📁 Assets folder ready for Windows build");
console.log(
  "🔄 To create a proper Windows icon, convert the SVG to ICO format",
);

// Create a simple PNG version too (for non-Windows platforms)
console.log("📝 SVG icon created - convert to ICO for best Windows experience");
