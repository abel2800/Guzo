const QR = require('qrcode');
const fs = require('fs');
const path = require('path');

const ip = process.argv[2];
const outDir = process.argv[3];
if (!ip || !outDir) {
  console.error('Usage: node scripts/generate-mobile-qrs.js <lan-ip> <output-dir>');
  process.exit(1);
}

const apps = [
  ['customer', 8081, 'GUZO Customer'],
  ['driver', 8082, 'GUZO Driver'],
  ['merchant', 8083, 'GUZO Merchant'],
  ['branch', 8084, 'GUZO Branch'],
];

fs.mkdirSync(outDir, { recursive: true });

(async () => {
  for (const [name, port, label] of apps) {
    const url = `exp://${ip}:${port}`;
    await QR.toFile(path.join(outDir, `${name}-expo-qr.png`), url, { width: 512, margin: 2 });
    fs.writeFileSync(
      path.join(outDir, `${name}-expo-url.txt`),
      `${label}\n${url}\n\niPhone: Expo Go -> Scan QR\nSamsung: Expo Go -> Scan QR\nSame Wi-Fi as PC required\n`,
    );
    console.log(`${label}: ${url}`);
  }

  fs.writeFileSync(
    path.join(outDir, 'README.txt'),
    [
      'GUZO Mobile — Expo Go QR codes',
      `LAN IP: ${ip}`,
      '',
      'Customer  exp://' + ip + ':8081',
      'Driver    exp://' + ip + ':8082',
      'Merchant  exp://' + ip + ':8083',
      'Branch    exp://' + ip + ':8084',
      '',
      'Scan with Expo Go on the same Wi-Fi as your dev machine.',
      'Demo users: run npm run db:seed (set SEED_DEMO_PASSWORD locally).',
    ].join('\n'),
  );
})();
