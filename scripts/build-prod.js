/**
 * Production Build Script
 * This script helps create a minimal production build
 * 
 * Run: node scripts/build-prod.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

console.log('=== Production Build Script ===\n');

// Step 1: Clean dist folder
console.log('1. Cleaning dist folder...');
const distPath = path.join(ROOT, 'dist');
if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true });
    console.log('   Removed old dist folder');
}

// Step 2: Build client without source maps
console.log('\n2. Building client (no source maps)...');
try {
    execSync('npm run build', {
        cwd: path.join(ROOT, 'client'),
        stdio: 'inherit',
        env: { ...process.env, GENERATE_SOURCEMAP: 'false' }
    });
} catch (e) {
    console.error('Client build failed');
    process.exit(1);
}

// Step 3: Remove source maps if any exist
console.log('\n3. Removing any source maps...');
const buildStatic = path.join(ROOT, 'client', 'build', 'static');
if (fs.existsSync(buildStatic)) {
    removeMapFiles(buildStatic);
}

function removeMapFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            removeMapFiles(filePath);
        } else if (file.endsWith('.map')) {
            fs.unlinkSync(filePath);
            console.log(`   Removed: ${file}`);
        }
    }
}

// Step 4: Build Electron app
console.log('\n4. Building Electron app...');
try {
    execSync('npx electron-builder', {
        cwd: ROOT,
        stdio: 'inherit'
    });
} catch (e) {
    console.error('Electron build failed');
    process.exit(1);
}

console.log('\n=== Build Complete ===');
console.log('Check the dist folder for the output.');
