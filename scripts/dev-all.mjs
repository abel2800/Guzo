#!/usr/bin/env node
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scriptsDir = path.join(root, 'scripts');

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Missing ${filePath}. Copy apps/server/.env.example and set your local values.`);
    process.exit(1);
  }
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function getLanIp() {
  const nets = os.networkInterfaces();
  for (const iface of Object.values(nets)) {
    for (const net of iface ?? []) {
      if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254')) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

function runPowerShellScript(scriptName, extraArgs = [], inherit = false) {
  return new Promise((resolve) => {
    const child = spawn(
      'powershell',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(scriptsDir, scriptName), ...extraArgs],
      { cwd: root, stdio: inherit ? 'inherit' : 'ignore', shell: false, windowsHide: true },
    );
    child.on('close', () => resolve());
    child.on('error', () => resolve());
  });
}

function startTask(name, scriptName, extraArgs = []) {
  const prefix = `[${name}] `;
  const child = spawn(
    'powershell',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(scriptsDir, scriptName), ...extraArgs],
    {
      cwd: root,
      env: process.env,
      shell: false,
      windowsHide: true,
    },
  );

  const pipe = (stream, out) => {
    stream.on('data', (chunk) => {
      const text = chunk.toString();
      for (const line of text.split(/\r?\n/)) {
        if (line.length > 0) out.write(prefix + line + '\n');
      }
    });
  };

  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  child.on('close', (code) => {
    if (code && code !== 0) {
      process.stderr.write(`${prefix}exited with code ${code}\n`);
    }
  });

  return child;
}

loadDotEnv(path.join(root, 'apps', 'server', '.env'));

const lanIp = getLanIp();
process.env.EXPO_PUBLIC_API_URL = `http://${lanIp}:4010/api/v1`;
process.env.GUZO_LAN_IP = lanIp;
process.env.PORT = '4010';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL must be set in apps/server/.env');
  process.exit(1);
}
if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET.length < 32) {
  console.error('JWT_ACCESS_SECRET must be at least 32 characters in apps/server/.env');
  process.exit(1);
}
if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
  console.error('JWT_REFRESH_SECRET must be at least 32 characters in apps/server/.env');
  process.exit(1);
}

console.log('');
console.log('============================================================');
console.log('  GUZO - starting full dev stack (one terminal)');
console.log('============================================================');
console.log('');
console.log('  Node API     http://localhost:4010/api/v1');
console.log('  Java API     http://localhost:4000/api/v1');
console.log('  Web app      http://localhost:3000');
console.log('  Marketing    http://localhost:3001');
console.log('');
console.log('  Expo Go (same Wi-Fi):');
console.log(`    Customer  exp://${lanIp}:8081`);
console.log(`    Driver    exp://${lanIp}:8082`);
console.log(`    Merchant  exp://${lanIp}:8083`);
console.log(`    Branch    exp://${lanIp}:8084`);
console.log('');
console.log('  QR codes: assets/mobile-qr/*.png');
console.log('  Wait ~30s after start for all Expo apps to be ready on iPhone');
console.log('  Press Ctrl+C to stop all services');
console.log('');

await runPowerShellScript('dev-stop.ps1');
await runPowerShellScript('sync-mobile-brand.ps1');
await runPowerShellScript('generate-mobile-qrs.ps1');

const children = [
  startTask('node', 'run-node-api.ps1'),
  startTask('java', 'dev-java-api.ps1'),
  startTask('web', 'run-web.ps1'),
  startTask('mkt', 'run-marketing.ps1'),
  startTask('cust', 'run-expo-app.ps1', ['-AppDir', 'mobile-customer', '-Port', '8081', '-DelaySeconds', '8']),
  startTask('drv', 'run-expo-app.ps1', ['-AppDir', 'mobile-driver', '-Port', '8082', '-DelaySeconds', '12']),
  startTask('mcht', 'run-expo-app.ps1', ['-AppDir', 'mobile-merchant', '-Port', '8083', '-DelaySeconds', '16']),
  startTask('brch', 'run-expo-app.ps1', ['-AppDir', 'mobile-branch', '-Port', '8084', '-DelaySeconds', '20']),
];

function shutdown() {
  for (const child of children) {
    if (!child.killed) {
      try {
        child.kill('SIGTERM');
      } catch {}
    }
  }
  setTimeout(() => process.exit(0), 500);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
