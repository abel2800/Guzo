# Chapter 10 — Development Workflow

| Field | Value |
|-------|-------|
| **Chapter** | 10 of 12 |
| **Title** | Development Workflow and Tooling |

---

## Table of Contents

1. [Development Modes](#1-development-modes)
2. [One-Command Startup](#2-one-command-startup)
3. [Port Reference](#3-port-reference)
4. [npm Scripts](#4-npm-scripts)
5. [PowerShell Scripts](#5-powershell-scripts)
6. [Database Workflow](#6-database-workflow)
7. [Testing](#7-testing)
8. [Code Quality](#8-code-quality)
9. [Mobile Development](#9-mobile-development)
10. [Build & Deployment](#10-build--deployment)
11. [Git Workflow](#11-git-workflow)
12. [Docker Services](#12-docker-services)

---

## 1. Development Modes

| Mode | Command | Use Case |
|------|---------|----------|
| Full stack | `npm run dev` | Daily development, integration testing |
| API only | `npm run dev:server` | Backend feature work |
| Web only | `npm run dev:web` | Frontend UI work |
| Single mobile | `npm run dev:mobile-*` | Mobile feature work |
| Java API | `npm run dev:server:java` | Java parity testing |

---

## 2. One-Command Startup

### 2.1 Start

```bash
npm run dev:stop    # Optional: release occupied ports
npm run dev         # Start all 8 services
```

### 2.2 What Starts

| Order | Service | Port | Launcher |
|-------|---------|------|----------|
| 1 | Node API | 4010 | `scripts/run-node-api.ps1` |
| 2 | Java API | 4000 | `scripts/dev-java-api.ps1` |
| 3 | Web dashboard | 3000 | `scripts/run-web.ps1` |
| 4 | Marketing | 3001 | `scripts/run-marketing.ps1` |
| 5 | Customer Expo | 8081 | `scripts/run-expo-app.ps1` |
| 6 | Driver Expo | 8082 | `scripts/run-expo-app.ps1` |
| 7 | Merchant Expo | 8083 | `scripts/run-expo-app.ps1` |
| 8 | Branch Expo | 8084 | `scripts/run-expo-app.ps1` |

### 2.3 Orchestrator

The launcher (`scripts/dev-all.mjs`) uses Node `child_process.spawn` with proper argument handling for paths containing spaces. Press `Ctrl+C` to terminate all child processes.

### 2.4 Environment Setup by Launcher

| Variable | Set By Launcher |
|----------|----------------|
| `EXPO_PUBLIC_API_URL` | Auto-detected LAN IP on port 4010 |
| `DATABASE_URL` | Forced to `postgresql://` format if invalid |

---

## 3. Port Reference

| Service | Port | Protocol |
|---------|------|----------|
| Web dashboard | 3000 | HTTP |
| Marketing site | 3001 | HTTP |
| Java API | 4000 | HTTP |
| Node API | 4010 | HTTP + WebSocket |
| Customer Expo | 8081 | HTTP (Metro) |
| Driver Expo | 8082 | HTTP (Metro) |
| Merchant Expo | 8083 | HTTP (Metro) |
| Branch Expo | 8084 | HTTP (Metro) |
| PostgreSQL (Docker) | 5433 | TCP |
| Redis (Docker) | 6379 | TCP |
| Mailpit UI (Docker) | 8025 | HTTP |
| MinIO (Docker) | 9000 | HTTP |
| Prisma Studio | 5555 | HTTP |

---

## 4. npm Scripts

### 4.1 Development

| Script | Description |
|--------|-------------|
| `dev` / `dev:all` | Start entire stack |
| `dev:stop` | Kill processes on GUZO ports |
| `dev:server` | Node API only |
| `dev:server:java` | Java API only |
| `dev:web` | Web dashboard only |
| `dev:marketing` | Marketing site only |
| `dev:mobile-customer` | Customer Expo only |
| `dev:mobile-driver` | Driver Expo only |
| `dev:mobile-merchant` | Merchant Expo only |
| `dev:mobile-branch` | Branch Expo only |
| `dev:mobile:phone` | Alias for full stack |

### 4.2 Mobile Tooling

| Script | Description |
|--------|-------------|
| `mobile:qr` | Regenerate Expo Go QR PNGs |
| `mobile:brand` | Sync brand assets to all apps |
| `mobile:splash` | Regenerate splash screens |

### 4.3 Database

| Script | Description |
|--------|-------------|
| `db:generate` | Prisma client generate |
| `db:migrate` | Apply migrations |
| `db:seed` | Insert seed data |
| `db:studio` | Open Prisma Studio |

### 4.4 Quality

| Script | Description |
|--------|-------------|
| `lint` | ESLint across TypeScript files |
| `format` | Prettier format |
| `typecheck:mobile` | TypeScript check all mobile packages |
| `build` | Build all workspaces |

### 4.5 Mobile Builds

| Script | Description |
|--------|-------------|
| `build:mobile:android` | Android EAS build |
| `build:mobile:ios` | iOS EAS build |
| `build:mobile:all` | Both platforms |
| `copy:mobile-builds` | Copy build artifacts |
| `eas:setup` | Initial EAS configuration |
| `eas:*:preview` | Per-app preview builds |
| `eas:*:prod` | Per-app production builds |

### 4.6 Docker

| Script | Description |
|--------|-------------|
| `docker:up` | Start containerized services |
| `docker:down` | Stop containerized services |

---

## 5. PowerShell Scripts

| Script | Purpose |
|--------|---------|
| `dev-all.ps1` | Wrapper for dev-all.mjs |
| `dev-stop.ps1` | Free ports 3000–3001, 4000, 4010, 8081–8084 |
| `run-node-api.ps1` | Start Node API with correct env |
| `dev-java-api.ps1` | Start Java API via Maven |
| `run-web.ps1` | Start web dashboard |
| `run-marketing.ps1` | Start marketing site |
| `run-expo-app.ps1` | Start single Expo app |
| `sync-mobile-brand.ps1` | Copy brand assets |
| `generate-mobile-splash.ps1` | Generate splash images |
| `generate-mobile-qrs.ps1` | Generate QR code PNGs |
| `build-mobile.ps1` | EAS build orchestration |
| `test-phase{N}-node.ps1` | Node API integration tests |
| `test-phase{N}-java.ps1` | Java API integration tests |

---

## 6. Database Workflow

### 6.1 Schema Change

```bash
# 1. Edit packages/database/prisma/schema.prisma
# 2. Create migration
cd packages/database
npx prisma migrate dev --name describe_change
# 3. Regenerate client
npm run db:generate
# 4. Add Flyway mirror for Java (if applicable)
```

### 6.2 Fresh Setup

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 6.3 Reset (Development)

```bash
npx prisma migrate reset --schema packages/database/prisma/schema.prisma
```

---

## 7. Testing

### 7.1 API Integration Tests

| Phase | Scope | Node Script | Java Script |
|-------|-------|-------------|-------------|
| 2 | Branches | test-phase2-node.ps1 | test-phase2-java.ps1 |
| 3 | Vehicle logs | test-phase3-node.ps1 | test-phase3-java.ps1 |
| 4 | Manifests | test-phase4-node.ps1 | test-phase4-java.ps1 |
| 5 | Admin platform | test-phase5-node.ps1 | test-phase5-java.ps1 |
| 6 | Merchant platform | test-phase6-node.ps1 | test-phase6-java.ps1 |
| 7 | Cross-cutting | test-phase7-node.ps1 | test-phase7-java.ps1 |

Set `$env:API_BASE` to target either backend:

```powershell
$env:API_BASE = "http://localhost:4010/api/v1"   # Node
$env:API_BASE = "http://localhost:4000/api/v1"   # Java
```

### 7.2 Java Unit Tests

```bash
mvn -f apps/guzo-api test
```

### 7.3 Mobile Type Check

```bash
npm run typecheck:mobile
```

---

## 8. Code Quality

| Tool | Config | Command |
|------|--------|---------|
| ESLint | Root `.eslintrc` | `npm run lint` |
| Prettier | Root `.prettierrc` | `npm run format` |
| TypeScript | Per-workspace `tsconfig.json` | `npm run build` |

---

## 9. Mobile Development

### 9.1 Expo Configuration

Each app uses `app.config.ts` with:
- Splash screen: black background, cover mode
- App icon from synced brand assets
- Expo SDK 54 with Expo Router

### 9.2 Expo Start Flags

Mobile apps start with: `npx expo start --offline -c`

| Flag | Purpose |
|------|---------|
| `--offline` | Prevent fetch failures in restricted networks |
| `-c` | Clear Metro cache |

Do not combine `--offline` with `--lan`.

### 9.3 Physical Device Checklist

1. Same Wi-Fi as development machine
2. `npm run dev` running (sets LAN API URL)
3. Scan QR from terminal or `assets/mobile-qr/`
4. Expo Go installed on device

---

## 10. Build & Deployment

### 10.1 Web Production Build

```bash
npm run build --workspace @guzo/web
```

### 10.2 Marketing Production Build

```bash
npm run build --workspace @guzo/marketing
```

### 10.3 Node API Production Build

```bash
npm run build --workspace @delivery/server
```

### 10.4 Java API Production Build

```bash
mvn -f apps/guzo-api package
```

---

## 11. Git Workflow

```bash
git checkout -b feature/description
# Make changes
npm run lint
npm run typecheck:mobile
git add .
git commit -m "feat: description of change"
git push -u origin feature/description
```

---

## 12. Docker Services

```bash
npm run docker:up
```

| Service | Image | Purpose |
|---------|-------|---------|
| PostgreSQL | postgres:16 | Database (port 5433) |
| Redis | redis:7 | Optional caching |
| Mailpit | axllent/mailpit | Email testing (port 8025) |
| MinIO | minio/minio | S3-compatible storage (port 9000) |

Configuration: `docker/docker-compose.yml`

---

*End of Chapter 10.*
