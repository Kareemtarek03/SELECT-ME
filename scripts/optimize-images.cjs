/**
 * Image Optimization Script
 * Run: npm install sharp --save-dev
 * Then: node scripts/optimize-images.cjs
 * 
 * This script compresses images in server/modules/PDF/assets
 * Expected savings: ~60-70% (317MB -> ~100MB)
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is installed
let sharp;
try {
    sharp = require('sharp');
} catch (e) {
    console.log('Sharp not installed. Run: npm install sharp --save-dev');
    console.log('\nManual optimization alternatives:');
    console.log('1. Use online tools like TinyPNG, Squoosh.app');
    console.log('2. Use ImageMagick: magick mogrify -quality 80 -resize 1200x1200\\> *.jpg');
    console.log('3. Use Windows: Right-click images -> Edit with Paint -> Save as JPEG (lower quality)');
    process.exit(1);
}

const ASSETS_DIR = path.join(__dirname, '..', 'server', 'modules', 'PDF', 'assets');
const QUALITY = 75; // JPEG quality (60-80 is good balance)
const MAX_WIDTH = 1200; // Max width in pixels
const MAX_HEIGHT = 1200; // Max height in pixels

// Delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function optimizeImage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const stats = fs.statSync(filePath);
    const originalSize = stats.size;

    try {
        // Read file into buffer first to avoid file locking issues
        const inputBuffer = fs.readFileSync(filePath);
        let image = sharp(inputBuffer);
        const metadata = await image.metadata();

        // Resize if too large
        if (metadata.width > MAX_WIDTH || metadata.height > MAX_HEIGHT) {
            image = image.resize(MAX_WIDTH, MAX_HEIGHT, {
                fit: 'inside',
                withoutEnlargement: true
            });
        }

        let outputBuffer;
        if (ext === '.jpg' || ext === '.jpeg') {
            outputBuffer = await image.jpeg({ quality: QUALITY, mozjpeg: true }).toBuffer();
        } else if (ext === '.png') {
            outputBuffer = await image.png({ compressionLevel: 9, palette: true }).toBuffer();
        } else {
            return { skipped: true, reason: 'unsupported format' };
        }

        // Only save if smaller
        if (outputBuffer.length < originalSize) {
            // Write to temp file first, then rename
            const tempPath = filePath + '.tmp';
            fs.writeFileSync(tempPath, outputBuffer);
            fs.unlinkSync(filePath);
            fs.renameSync(tempPath, filePath);
            return {
                originalSize,
                newSize: outputBuffer.length,
                saved: originalSize - outputBuffer.length
            };
        }
        return { skipped: true, reason: 'already optimized' };
    } catch (err) {
        return { error: err.message };
    }
}

async function walkDir(dir, callback) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            await walkDir(filePath, callback);
        } else {
            await callback(filePath);
        }
    }
}

async function main() {
    console.log('Starting image optimization...');
    console.log(`Assets directory: ${ASSETS_DIR}`);
    console.log(`Quality: ${QUALITY}, Max dimensions: ${MAX_WIDTH}x${MAX_HEIGHT}\n`);

    let totalOriginal = 0;
    let totalNew = 0;
    let processed = 0;
    let skipped = 0;
    let errors = 0;

    await walkDir(ASSETS_DIR, async (filePath) => {
        const ext = path.extname(filePath).toLowerCase();
        if (['.jpg', '.jpeg', '.png'].includes(ext)) {
            const result = await optimizeImage(filePath);
            if (result.error) {
                console.log(`ERROR: ${path.relative(ASSETS_DIR, filePath)} - ${result.error}`);
                errors++;
            } else if (result.skipped) {
                skipped++;
            } else {
                totalOriginal += result.originalSize;
                totalNew += result.newSize;
                processed++;
                const savedPct = ((result.saved / result.originalSize) * 100).toFixed(1);
                console.log(`Optimized: ${path.relative(ASSETS_DIR, filePath)} - saved ${(result.saved / 1024).toFixed(0)}KB (${savedPct}%)`);
            }
        }
    });

    console.log('\n=== Summary ===');
    console.log(`Processed: ${processed} files`);
    console.log(`Skipped: ${skipped} files`);
    console.log(`Errors: ${errors} files`);
    if (processed > 0) {
        console.log(`Total saved: ${((totalOriginal - totalNew) / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Compression ratio: ${((1 - totalNew / totalOriginal) * 100).toFixed(1)}%`);
    }
}

main().catch(console.error);
