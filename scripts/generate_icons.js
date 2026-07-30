import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgBuffer = fs.readFileSync(path.join(process.cwd(), 'public', 'icon.svg'));

async function generateIcons() {
  const publicDir = path.join(process.cwd(), 'public');

  // Background color matching app theme (#111827)
  const bg = { r: 17, g: 24, b: 39, alpha: 1 };

  // 180x180 Apple Touch Icon (iOS Home Screen)
  await sharp(svgBuffer)
    .resize(180, 180, { fit: 'contain', background: bg })
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 192x192 Android / PWA Icon
  await sharp(svgBuffer)
    .resize(192, 192, { fit: 'contain', background: bg })
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));

  // 512x512 Android / PWA Large Icon
  await sharp(svgBuffer)
    .resize(512, 512, { fit: 'contain', background: bg })
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));

  // 64x64 Favicon PNG
  await sharp(svgBuffer)
    .resize(64, 64, { fit: 'contain', background: bg })
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));

  // 32x32 Favicon ICO replacement
  await sharp(svgBuffer)
    .resize(32, 32, { fit: 'contain', background: bg })
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));

  console.log('✅ Successfully generated all app icons from custom SVG!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
