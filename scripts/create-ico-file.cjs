const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createIcoFile() {
    const outputDir = path.join(__dirname, '..', 'client', 'public');
    const icoPath = path.join(outputDir, 'favicon.ico');

    // For .ico files, we need to use a different approach
    // Sharp doesn't directly support .ico output, so we'll use the largest PNG
    // and update package.json to use PNG instead, which electron-builder can handle

    const icon256Path = path.join(outputDir, 'icon-256.png');

    if (!fs.existsSync(icon256Path)) {
        console.error('Error: icon-256.png not found. Run generate-circular-icon.cjs first.');
        process.exit(1);
    }

    console.log('Note: Electron Builder can use PNG files directly for Windows icons.');
    console.log('The circular icon-256.png will be used as the app icon.');
    console.log('\nTo create a proper .ico file with multiple resolutions:');
    console.log('1. Install ImageMagick: https://imagemagick.org/script/download.php');
    console.log('2. Run: magick convert icon-16.png icon-32.png icon-48.png icon-64.png icon-128.png icon-256.png favicon.ico');
    console.log('\nOr use an online converter like https://convertio.co/png-ico/');
    console.log('\nFor now, updating package.json to use icon-256.png...');

    // Read package.json
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Update the icon path to use PNG
    if (packageJson.build && packageJson.build.win) {
        packageJson.build.win.icon = 'client/public/icon-256.png';
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
        console.log('✅ Updated package.json to use icon-256.png');
    }

    // Also update electron-main.cjs icon path
    const electronMainPath = path.join(__dirname, '..', 'electron-main.cjs');
    let electronMain = fs.readFileSync(electronMainPath, 'utf8');

    // Replace the icon path in electron-main.cjs
    const oldIconLine = 'path.join(resourcesPath, "client", "build", "favicon.ico")';
    const newIconLine = 'path.join(resourcesPath, "client", "build", "icon-256.png")';

    if (electronMain.includes(oldIconLine)) {
        electronMain = electronMain.replace(oldIconLine, newIconLine);
        fs.writeFileSync(electronMainPath, electronMain);
        console.log('✅ Updated electron-main.cjs to use icon-256.png');
    }

    console.log('\n✅ Configuration updated to use circular PNG icon!');
    console.log('The app icon will now appear circular with transparent background.');
}

createIcoFile().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
