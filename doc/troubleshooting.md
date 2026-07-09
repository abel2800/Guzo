# Chapter 12 — Troubleshooting

| Field | Value |
|-------|-------|
| **Chapter** | 12 of 12 |
| **Title** | Troubleshooting and Diagnostics |

---

## Table of Contents

1. [General Diagnostics](#1-general-diagnostics)
2. [Port Conflicts](#2-port-conflicts)
3. [Database Issues](#3-database-issues)
4. [API Errors](#4-api-errors)
5. [Web Dashboard Issues](#5-web-dashboard-issues)
6. [Mobile / Expo Issues](#6-mobile--expo-issues)
7. [Java API Issues](#7-java-api-issues)
8. [Docker Issues](#8-docker-issues)
9. [Windows-Specific Issues](#9-windows-specific-issues)
10. [Diagnostic Commands](#10-diagnostic-commands)

---

## 1. General Diagnostics

### 1.1 Health Check Sequence

Run these checks in order when the platform is not responding:

| Step | Command / Action | Expected |
|------|------------------|----------|
| 1 | `npm run dev:stop` | Ports freed |
| 2 | `npm run dev` | All services start |
| 3 | `curl http://localhost:4010/api/v1/health` | `success: true` |
| 4 | Open http://localhost:3000/login | Login page renders |
| 5 | Login with demo account | Dashboard loads |

### 1.2 Log Locations

| Service | Log Output |
|---------|------------|
| Node API | Terminal stdout (Winston) |
| Java API | Terminal stdout (Spring Boot) |
| Web | Terminal stdout (Next.js) |
| Expo | Terminal stdout (Metro) |

---

## 2. Port Conflicts

### 2.1 Symptom

```
Error: listen EADDRINUSE: address already in use :::3000
```

### 2.2 Solution

```bash
npm run dev:stop
```

This kills processes on ports: 3000, 3001, 4000, 4010, 8081, 8082, 8083, 8084.

### 2.3 Manual Port Check (Windows)

```powershell
netstat -ano | findstr :4010
taskkill /PID <pid> /F
```

### 2.4 Port Map

| Port | Service |
|------|---------|
| 3000 | Web |
| 3001 | Marketing |
| 4000 | Java API |
| 4010 | Node API |
| 8081–8084 | Expo apps |

---

## 3. Database Issues

### 3.1 Invalid DATABASE_URL

**Symptom:** Prisma validation error about connection string format.

**Cause:** Shell environment has a JDBC-style URL (`jdbc:postgresql://`) or a missing `.env` file.

**Solution:** Copy `apps/server/.env.example` to `apps/server/.env`, set `DATABASE_URL` using the Prisma `postgresql://` format, and restart the API.

### 3.2 Connection Refused

**Symptom:** `Can't reach database server at localhost:5433`

**Solutions:**

1. Start PostgreSQL: `npm run docker:up`
2. Verify credentials in `.env`
3. Check PostgreSQL is listening: `netstat -ano | findstr :5433`

### 3.3 Migration Failures

**Symptom:** `prisma migrate` fails with schema conflict.

**Solution (development only):**

```bash
npx prisma migrate reset --schema packages/database/prisma/schema.prisma
```

### 3.4 Seed Failures

**Symptom:** Duplicate key errors during seed.

**Solution:** Reset database (above) or delete conflicting rows via Prisma Studio.

---

## 4. API Errors

### 4.1 401 Unauthorized

| Cause | Solution |
|-------|----------|
| Expired access token | Client should auto-refresh; re-login if refresh fails |
| Missing Authorization header | Ensure Bearer token is sent |
| Invalid JWT secret | Ensure `JWT_ACCESS_SECRET` is set in `apps/server/.env` |

### 4.2 403 Forbidden

| Cause | Solution |
|-------|----------|
| Insufficient role | Login with correct role account |
| Missing permission | Check role_permissions in database |
| Wrong app for role | Driver app requires DRIVER role, etc. |

### 4.3 429 Rate Limited

**Cause:** Too many auth attempts.

**Solution:** Wait for rate limit window to expire, or restart API server in development.

### 4.4 CORS Errors

**Symptom:** Browser blocks API requests from web dashboard.

**Solution:** Add frontend origin to `CORS_ORIGINS` in `apps/server/.env`:

```env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

---

## 5. Web Dashboard Issues

### 5.1 Blank Dashboard Section

**Cause:** Section not registered in `section-registry.tsx`.

**Solution:** Add component mapping for `${role}/${section}` key.

### 5.2 Wrong Role Dashboard

**Cause:** User has multiple roles; priority selection applies.

**Solution:** Check `ROLE_PRIORITY` in `roles.ts`. Log in with a single-role account for testing.

### 5.3 Socket Not Connecting

| Check | Action |
|-------|--------|
| `NEXT_PUBLIC_SOCKET_URL` | Should point to API host (port 4010) |
| API running | Verify health endpoint |
| Token valid | Re-login |

---

## 6. Mobile / Expo Issues

### 6.1 "Problem Running Requested App"

| Step | Action |
|------|--------|
| 1 | `npm run dev:stop` |
| 2 | `npm run dev` |
| 3 | Scan fresh QR code |
| 4 | Ensure same Wi-Fi network |

### 6.2 Expo Fetch Failed

**Cause:** Network restrictions or registry unreachable.

**Solution:** Expo starts with `--offline` flag. Do not add `--lan` simultaneously.

### 6.3 Splash Screen Too Small / White Box

| Step | Action |
|------|--------|
| 1 | `npm run mobile:brand` |
| 2 | `npm run mobile:splash` |
| 3 | Restart Expo with `-c` (clear cache) |
| 4 | Verify no `imageWidth` in `app.config.ts` |

### 6.4 API Not Reachable from Phone

**Cause:** `EXPO_PUBLIC_API_URL` points to `localhost`.

**Solution:** Use `npm run dev` which auto-sets LAN IP. Manual override:

```bash
set EXPO_PUBLIC_API_URL=http://192.168.x.x:4010/api/v1
```

### 6.5 Only One Expo App Works

**Cause:** Port conflict or stale Metro process.

**Solution:** `npm run dev:stop`, then `npm run dev` for staggered startup of all four apps.

### 6.6 Expo Plugin Error (Driver App)

**Cause:** Incorrect `SPLASH_PLUGIN` spread in `app.config.ts`.

**Solution:** Use `SPLASH_PLUGIN` directly, not `...SPLASH_PLUGIN`.

### 6.7 QR Code Not Scanning

| Check | Action |
|-------|--------|
| QR freshness | Run `npm run mobile:qr` |
| Camera focus | Use PNG from `assets/mobile-qr/` |
| Expo Go version | Update Expo Go on device |

---

## 7. Java API Issues

### 7.1 Maven Build Failure

```bash
cd apps/guzo-api
mvn clean package -DskipTests
```

### 7.2 Flyway Migration Conflict

**Cause:** Java migration applied but Prisma schema differs.

**Solution:** Ensure Flyway scripts mirror Prisma migrations. Check `V100+` scripts.

### 7.3 Port 4000 in Use

```bash
npm run dev:stop
```

Or change Java port in `application.properties`.

---

## 8. Docker Issues

### 8.1 Docker Not Running

**Symptom:** `Cannot connect to the Docker daemon`

**Solution:** Start Docker Desktop, then `npm run docker:up`.

### 8.2 Port 5433 Conflict

**Solution:** Change Docker Compose port mapping or stop conflicting PostgreSQL instance.

---

## 9. Windows-Specific Issues

### 9.1 Path with Spaces

**Symptom:** `Processing -File 'D:\New'` — script path truncated.

**Cause:** Tools splitting on spaces (e.g. old `concurrently` config).

**Solution:** Use `npm run dev` which uses `dev-all.mjs` with proper spawn arguments.

### 9.2 Metro File Watch Limit

**Symptom:** Metro bundler misses file changes.

**Solution:** The `postinstall` script runs `fix-metro-watch.ps1` automatically.

### 9.3 PowerShell Execution Policy

**Symptom:** Scripts cannot run.

**Solution:** npm scripts use `-ExecutionPolicy Bypass` flag.

### 9.4 dev-stop Kills Wrong Process

**Cause:** Previous bug with `$pid` variable shadowing in PowerShell.

**Status:** Fixed in `dev-stop.ps1` — uses explicit variable names.

---

## 10. Diagnostic Commands

| Command | Purpose |
|---------|---------|
| `npm run dev:stop` | Free all GUZO ports |
| `curl http://localhost:4010/api/v1/health` | Node API health |
| `curl http://localhost:4000/api/v1/health` | Java API health |
| `npm run db:studio` | Inspect database |
| `npm run typecheck:mobile` | Mobile TypeScript errors |
| `npm run lint` | ESLint issues |
| `npx prisma migrate status` | Migration state |
| `netstat -ano \| findstr :4010` | Check port usage |
| `npm run mobile:qr` | Regenerate QR codes |
| `npm run mobile:brand` | Resync brand assets |

---

*End of Chapter 12. End of documentation set.*
