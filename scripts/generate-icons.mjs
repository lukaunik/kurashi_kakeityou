import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const inputSvgPath = path.join(rootDir, 'public', 'icons', 'icon-source.svg');
const outputDir = path.join(rootDir, 'public', 'icons');

const targets = [
  { filename: 'apple-touch-icon.png', size: 180 },
  { filename: 'icon-192.png', size: 192 },
  { filename: 'icon-512.png', size: 512 },
  { filename: 'favicon-32x32.png', size: 32 },
  { filename: 'favicon-16x16.png', size: 16 },
];

async function generateIcons() {
  if (!fs.existsSync(inputSvgPath)) {
    console.error(`SVG source file not found: ${inputSvgPath}`);
    process.exit(1);
  }

  const svgBuffer = fs.readFileSync(inputSvgPath);

  console.log(`Generating icons from ${inputSvgPath}...`);

  for (const { filename, size } of targets) {
    const destPath = path.join(outputDir, filename);
    await sharp(svgBuffer, { density: 300 })
      .resize(size, size)
      .png()
      .toFile(destPath);
    console.log(`✓ Generated ${filename} (${size}x${size})`);
  }

  console.log('All icons generated successfully!');
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
