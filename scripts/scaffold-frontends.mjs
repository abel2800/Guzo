/* eslint-disable */
// ============================================================================
// Clones apps/customer-web into the other three portals. The app code is
// role-agnostic (it reads NEXT_PUBLIC_APP_ROLE / _TITLE), so the only per-app
// differences are package name, dev port and .env.local. Non-destructive.
//
//   node scripts/scaffold-frontends.mjs
// ============================================================================
import { cpSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APPS = join(__dirname, '..', 'apps');
const SRC = join(APPS, 'customer-web');

const TARGETS = [
  { dir: 'admin-dashboard', name: '@delivery/admin-dashboard', port: 3001, title: 'Admin Console', role: 'ADMIN' },
  { dir: 'merchant-dashboard', name: '@delivery/merchant-dashboard', port: 3002, title: 'Merchant Console', role: 'MERCHANT' },
  { dir: 'driver-dashboard', name: '@delivery/driver-dashboard', port: 3003, title: 'Driver App', role: 'DRIVER' },
];

let created = 0;
for (const t of TARGETS) {
  const dest = join(APPS, t.dir);
  if (existsSync(dest)) {
    console.log(`skip ${t.dir} (already exists)`);
    continue;
  }

  cpSync(SRC, dest, {
    recursive: true,
    filter: (src) => !src.includes('node_modules') && !src.includes('.next'),
  });

  // package.json: name + ports
  const pkgPath = join(dest, 'package.json');
  let pkg = readFileSync(pkgPath, 'utf8');
  pkg = pkg
    .replace('"@delivery/customer-web"', `"${t.name}"`)
    .replace(/-p 3000/g, `-p ${t.port}`)
    .replace(/start -p 3000/g, `start -p ${t.port}`);
  writeFileSync(pkgPath, pkg);

  // .env.local: title + role
  const envPath = join(dest, '.env.local');
  writeFileSync(
    envPath,
    `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NEXT_PUBLIC_APP_TITLE=${t.title}
NEXT_PUBLIC_APP_ROLE=${t.role}
`,
  );

  // Remove any copied build artifacts just in case.
  rmSync(join(dest, '.next'), { recursive: true, force: true });

  created++;
  console.log(`created ${t.dir} (port ${t.port}, role ${t.role})`);
}

console.log(`Frontend scaffold complete. ${created} app(s) created.`);
