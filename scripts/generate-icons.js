import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Standard Brand SVG for 3-4 (Three-Four) Kibbutz Jobs
const svgStandard = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f766e" />
      <stop offset="50%" stop-color="#115e59" />
      <stop offset="100%" stop-color="#042f2e" />
    </linearGradient>
    <linearGradient id="numGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399" />
      <stop offset="100%" stop-color="#10b981" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#fbbf24" />
    </linearGradient>
  </defs>

  <!-- Background with rounded corners -->
  <rect width="512" height="512" rx="110" fill="url(#bgGrad)" />

  <!-- Subtle glow ring -->
  <circle cx="256" cy="256" r="210" fill="none" stroke="#2dd4bf" stroke-width="4" stroke-opacity="0.3" />

  <!-- Diagonal dynamic divider -->
  <line x1="120" y1="390" x2="390" y2="120" stroke="#5eead4" stroke-width="12" stroke-linecap="round" stroke-opacity="0.75" />

  <!-- Numerals 3 & 4 representing "Shalosh - Arba" -->
  <text x="340" y="220" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="190" fill="#ffffff" text-anchor="middle" letter-spacing="-5">3</text>
  <text x="180" y="380" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="190" fill="url(#accentGrad)" text-anchor="middle" letter-spacing="-5">4</text>

  <!-- Community / Mutual help handshake icon or sparkle -->
  <circle cx="390" cy="120" r="22" fill="#fbbf24" />
  <circle cx="120" cy="390" r="16" fill="#34d399" />
</svg>
`;

// Maskable SVG with padded safe zone (central 80% circle)
const svgMaskable = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f766e" />
      <stop offset="50%" stop-color="#115e59" />
      <stop offset="100%" stop-color="#042f2e" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#fbbf24" />
    </linearGradient>
  </defs>

  <!-- Full bleed background without border radius for maskable -->
  <rect width="512" height="512" fill="url(#bgGrad)" />

  <!-- Scaled content inside safe zone (padding 18%) -->
  <g transform="translate(60, 60) scale(0.76)">
    <circle cx="256" cy="256" r="210" fill="none" stroke="#2dd4bf" stroke-width="6" stroke-opacity="0.35" />
    <line x1="120" y1="390" x2="390" y2="120" stroke="#5eead4" stroke-width="14" stroke-linecap="round" stroke-opacity="0.8" />
    <text x="340" y="220" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="190" fill="#ffffff" text-anchor="middle" letter-spacing="-5">3</text>
    <text x="180" y="380" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="190" fill="url(#accentGrad)" text-anchor="middle" letter-spacing="-5">4</text>
    <circle cx="390" cy="120" r="24" fill="#fbbf24" />
    <circle cx="120" cy="390" r="18" fill="#34d399" />
  </g>
</svg>
`;

async function generate() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Save icon.svg
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgStandard);

  const stdBuffer = Buffer.from(svgStandard);
  const maskBuffer = Buffer.from(svgMaskable);

  // 192x192 PNG
  await sharp(stdBuffer).resize(192, 192).png().toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Generated pwa-192x192.png');

  // 512x512 PNG
  await sharp(stdBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Generated pwa-512x512.png');

  // 512x512 Maskable PNG
  await sharp(maskBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Generated pwa-maskable-512x512.png');

  // 180x180 Apple Touch Icon (iOS Safari requires PNG)
  await sharp(stdBuffer).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // Favicon 64x64 PNG & ico
  await sharp(stdBuffer).resize(64, 64).png().toFile(path.join(publicDir, 'favicon.png'));
  console.log('Generated favicon.png');
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
