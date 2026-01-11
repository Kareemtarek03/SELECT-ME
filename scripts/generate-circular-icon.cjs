const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateCircularIcon() {
    const inputSvg = path.join(__dirname, '..', 'client', 'public', 'logo.svg');
    const outputDir = path.join(__dirname, '..', 'client', 'public');

    console.log('Generating circular icon with WHITE background from:', inputSvg);

    // Read the SVG
    const svgBuffer = fs.readFileSync(inputSvg);

    // Sizes needed for .ico file (Windows standard)
    const sizes = [16, 32, 48, 64, 128, 256];

    // Generate PNG files with WHITE circular background for each size
    const pngPromises = sizes.map(async (size) => {
        const outputPng = path.join(outputDir, `icon-${size}.png`);

        const radius = size / 2;
        const padding = 0; // No padding, circle fills the entire canvas

        // Step 1: Create white circle background with transparent corners
        const whiteCircleSvg = `
            <svg width="${size}" height="${size}">
                <circle cx="${radius}" cy="${radius}" r="${radius}" fill="white"/>
            </svg>
        `;

        // Step 2: Resize and scale the logo to fit inside the circle (with some padding)
        const logoScale = 0.7; // Logo takes 70% of circle diameter
        const logoSize = Math.floor(size * logoScale);
        const logoOffset = Math.floor((size - logoSize) / 2);

        // Process the logo
        const resizedLogo = await sharp(svgBuffer)
            .resize(logoSize, logoSize, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 0 }
            })
            .png()
            .toBuffer();

        // Step 3: Composite white circle + logo on transparent background
        await sharp({
            create: {
                width: size,
                height: size,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
        })
            .composite([
                // First: white circle background
                {
                    input: Buffer.from(whiteCircleSvg),
                    top: 0,
                    left: 0
                },
                // Second: logo on top
                {
                    input: resizedLogo,
                    top: logoOffset,
                    left: logoOffset
                }
            ])
            .png()
            .toFile(outputPng);

        console.log(`Generated ${size}x${size} PNG with white circular background:`, outputPng);
        return outputPng;
    });

    await Promise.all(pngPromises);

    console.log('\n✅ Circular icon PNGs generated successfully!');
    console.log('\nNext steps:');
    console.log('1. Use an online tool or Windows tool to convert PNGs to .ico:');
    console.log('   - https://convertio.co/png-ico/');
    console.log('   - Or use ImageMagick: magick convert icon-*.png favicon.ico');
    console.log('2. Replace client/public/favicon.ico with the new circular .ico file');
    console.log('\nAlternatively, you can use the generated icon-256.png directly in package.json');
}

generateCircularIcon().catch(err => {
    console.error('Error generating circular icon:', err);
    process.exit(1);
});
