# Chapter 1 — Getting Started

| Field | Value |
|-------|-------|
| **Chapter** | 1 of 12 |
| **Title** | Installation and First Run |
| **Prerequisites** | Node.js 20+, npm 9+, PostgreSQL 14+ |

---

## Table of Contents

1. [System Requirements](#1-system-requirements)
2. [Repository Setup](#2-repository-setup)
3. [Database Configuration](#3-database-configuration)
4. [Schema Initialization](#4-schema-initialization)
5. [Environment Variables](#5-environment-variables)
6. [Running the Platform](#6-running-the-platform)
7. [Verification Checklist](#7-verification-checklist)
8. [Demo Accounts](#8-demo-accounts)
9. [Next Steps](#9-next-steps)

---

## 1. System Requirements

### 1.1 Required Software

| Software | Minimum Version | Purpose |
|----------|-----------------|---------|
| Node.js | 20.0.0 | APIs, web, mobile tooling, scripts |
| npm | 9.0.0 | Workspace package management |
| PostgreSQL | 14 | Primary database |
| Git | 2.x | Source control |

### 1.2 Optional Software

| Software | Purpose |
|----------|---------|
| Java JDK | 22+ | Java API (`apps/guzo-api`) |
| Maven | 3.9+ | Build and run Java API |
| Docker Desktop | Containerized Postgres, Redis, Mailpit, MinIO |
| Expo Go (mobile) | Physical device testing for mobile apps |
| EAS CLI | Production mobile builds (included in devDependencies) |

### 1.3 Hardware Recommendations

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 8 GB | 16 GB (full stack + 4 Expo apps) |
| Disk | 4 GB free | 10 GB free |
| Network | LAN for phone testing | Stable Wi-Fi for Expo Go |

---

## 2. Repository Setup

### 2.1 Clone and Install

```bash
git clone https://github.com/abel2800/Guzo.git
cd Guzo
npm install
```

The `postinstall` script configures Metro file-watching for Windows compatibility.

### 2.2 Workspace Structure

GUZO uses npm workspaces. The root `package.json` orchestrates all applications under `apps/*` and shared libraries under `packages/*`. A single `npm install` at the root installs dependencies for every workspace.

---

## 3. Database Configuration

### 3.1 Option A — Local PostgreSQL

Create a database named `Guzo` (or your preferred name). The default Docker configuration uses port **5433** to avoid conflicts with a system PostgreSQL on 5432.

### 3.2 Option B — Docker Compose

```bash
npm run docker:up
```

This starts:

| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL | 5433 | Database |
| Redis | 6379 | Optional caching |
| Mailpit | 8025 | Email testing UI |
| MinIO | 9000 | S3-compatible storage |

### 3.3 Server Environment File

Create `apps/server/.env` locally by copying the example file:

```bash
cp apps/server/.env.example apps/server/.env
```

Fill in your own values for database connection, JWT secrets, and seed password. This file is never committed to version control.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection (Prisma `postgresql://` format) |
| `JWT_ACCESS_SECRET` | Yes | Access token signing key (32+ characters) |
| `JWT_REFRESH_SECRET` | Yes | Refresh token signing key (32+ characters) |
| `SEED_DEMO_PASSWORD` | For seeding | Password applied to locally seeded demo users |
| `PORT` | No | API port (default `4010`) |
| `CORS_ORIGINS` | No | Allowed frontend origins |

**Important:** Never commit `apps/server/.env`. Use `postgresql://` URLs for Prisma (not JDBC format).

---

## 4. Schema Initialization

Run these commands from the repository root in order:

```bash
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Apply all migrations
npm run db:seed        # Insert roles, permissions, demo data
```

### 4.1 What the Seed Creates

| Data | Details |
|------|---------|
| Roles | 11 roles from SUPER_ADMIN to BRANCH_STAFF |
| Permissions | 90+ `resource.action` keys |
| Demo users | One account per role (see Section 8) |
| Warehouse | Addis Central Hub (`WH-ADD-001`) |
| Pricing rules | Standard, Express, Same-day tiers |
| Coupon | `WELCOME10` — 10% discount, max 100 ETB |
| Vehicle | Driver motorcycle (Bajaj Boxer, plate `AA-12345`) |
| Support ticket | Sample ticket with threaded messages |
| Addresses | Home and office for demo customer |
| Branch | Guzo Bole branch with assigned staff |

### 4.2 Browse Data

```bash
npm run db:studio
```

Opens Prisma Studio at http://localhost:5555 for visual data inspection.

---

## 5. Environment Variables

### 5.1 Node API (`apps/server/.env`)

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `PORT` | 4010 | No | HTTP listen port |
| `DATABASE_URL` | — | **Yes** | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | — | **Yes** | Access token signing key (32+ chars) |
| `JWT_REFRESH_SECRET` | — | **Yes** | Refresh token signing key (32+ chars) |
| `CORS_ORIGINS` | localhost list | No | Comma-separated allowed origins |
| `API_PUBLIC_URL` | http://localhost:4010 | No | Public URL for file/asset links |
| `REDIS_ENABLED` | false | No | Enable Redis session/cache |
| `STORAGE_DRIVER` | local | No | `local` or future `s3`/`minio` |
| `PAYMENT_PROVIDER` | fake | No | Payment abstraction driver |
| `EMAIL_DRIVER` | console | No | `console`, `smtp`, or `mailpit` |
| `OSRM_BASE_URL` | public OSRM | No | Routing service |
| `NOMINATIM_BASE_URL` | Nominatim | No | Geocoding service |

### 5.2 Web Dashboard (`apps/web`)

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | http://localhost:4010/api/v1 | API base URL |
| `NEXT_PUBLIC_SOCKET_URL` | http://localhost:4010 | Socket.IO server URL |

### 5.3 Mobile Apps

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | API URL; use LAN IP when testing on a physical device |

The `npm run dev` launcher sets `EXPO_PUBLIC_API_URL` automatically using your machine's LAN address.

---

## 6. Running the Platform

### 6.1 Recommended — Full Stack (One Terminal)

```bash
npm run dev:stop    # Optional: free ports 3000, 3001, 4000, 4010, 8081–8084
npm run dev         # Start all services
```

This launches, in order:

1. Node API (4010)
2. Java API (4000)
3. Web dashboard (3000)
4. Marketing site (3001)
5. Customer Expo (8081)
6. Driver Expo (8082)
7. Merchant Expo (8083)
8. Branch Expo (8084)

Press `Ctrl+C` to terminate all child processes.

### 6.2 Individual Services

| Service | Command |
|---------|---------|
| Node API only | `npm run dev:server` |
| Java API only | `npm run dev:server:java` |
| Web dashboard | `npm run dev:web` |
| Marketing site | `npm run dev:marketing` |
| Customer mobile | `npm run dev:mobile-customer` |
| Driver mobile | `npm run dev:mobile-driver` |
| Merchant mobile | `npm run dev:mobile-merchant` |
| Branch mobile | `npm run dev:mobile-branch` |

### 6.3 Physical Device Testing (Expo Go)

1. Ensure phone and development machine share the same Wi-Fi network.
2. Run `npm run dev` or a single mobile command.
3. Scan the QR code displayed in the terminal, or open a pre-generated image from `assets/mobile-qr/`.
4. Regenerate QR codes after IP changes: `npm run mobile:qr`.

---

## 7. Verification Checklist

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | `curl http://localhost:4010/api/v1/health` | `{"success":true,...}` |
| 2 | Open http://localhost:3001 | Marketing home page loads |
| 3 | Open http://localhost:3000/login | Login form renders |
| 4 | Login with a seeded demo user | Redirect to role dashboard |
| 5 | Scan Customer Expo QR | App loads in Expo Go |

---

## 8. Demo Accounts

Running `npm run db:seed` creates one user per role for local testing. Set `SEED_DEMO_PASSWORD` in `apps/server/.env` before seeding. Demo user emails appear in the seed output — credentials remain on your machine only.

---

## 9. Next Steps

| Goal | Document |
|------|----------|
| Understand system design | [Architecture](architecture.md) |
| API integration | [API Servers](api-servers.md) |
| Web development | [Web Dashboard](web-dashboard.md) |
| Mobile development | [Mobile Applications](mobile-apps.md) |
| Resolve setup issues | [Troubleshooting](troubleshooting.md) |

---

*End of Chapter 1.*
