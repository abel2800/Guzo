# GUZO Platform Documentation

| Field | Value |
|-------|-------|
| **Product** | GUZO — Enterprise Logistics & Delivery Platform |
| **Document set** | Technical Reference Manual |
| **Version** | 0.2.0 |
| **Last updated** | July 2026 |
| **Audience** | Developers, operators, integrators |
| **Repository** | [github.com/abel2800/Guzo](https://github.com/abel2800/Guzo) |

---

## 1. Introduction

GUZO is a full-stack logistics platform designed for parcel booking, dispatch, warehouse operations, branch counter service, live tracking, payments, and customer support. The system is implemented as a **modular monolith** with a shared PostgreSQL database, dual REST APIs (Node and Java), a role-based web dashboard, a public marketing website, and four native mobile applications built with Expo.

This documentation set describes every major component: installation, architecture, APIs, client applications, operational roles, development workflow, database schema, security model, branding standards, and troubleshooting procedures.

---

## 2. Document Index

| No. | Document | Scope |
|-----|----------|-------|
| 1 | [Getting Started](getting-started.md) | Prerequisites, installation, database initialization, first run |
| 2 | [Architecture](architecture.md) | System design, monorepo layout, request flow, shared packages |
| 3 | [API Servers](api-servers.md) | Node and Java APIs, endpoints, auth, realtime, providers |
| 4 | [Web Dashboard](web-dashboard.md) | Next.js console, routing, navigation, all role workspaces |
| 5 | [Marketing Site](marketing-site.md) | Public website, pages, components, content structure |
| 6 | [Mobile Applications](mobile-apps.md) | Customer, Driver, Merchant, Branch Expo apps |
| 7 | [Features & Roles](features-and-roles.md) | Order lifecycle, RBAC, permissions, capability matrix |
| 8 | [Database](database.md) | Schema, tables, migrations, seed data, commands |
| 9 | [Security](security.md) | Authentication, authorization, tokens, audit, hardening |
| 10 | [Development Workflow](development-workflow.md) | One-command dev, ports, scripts, testing, builds |
| 11 | [Branding & Assets](branding-and-assets.md) | Logos, splash screens, design system, QR codes |
| 12 | [Troubleshooting](troubleshooting.md) | Common errors, port conflicts, mobile issues, diagnostics |
| — | [Changelog](CHANGELOG.md) | Recent platform updates (OTP, pickup flow, vehicle profile, UI navigation) |

---

## 3. Platform Summary

### 3.1 Client Applications

| Application | Path | Port | Technology |
|-------------|------|------|------------|
| Node API (primary dev) | `apps/server` | 4010 | Express, TypeScript, Prisma |
| Java API (production target) | `apps/guzo-api` | 4000 | Spring Boot, Flyway, JPA |
| Web dashboard | `apps/web` | 3000 | Next.js 15, React 19 |
| Marketing site | `apps/marketing` | 3001 | Next.js, Three.js |
| Customer mobile | `apps/mobile-customer` | 8081 | Expo SDK 54 |
| Driver mobile | `apps/mobile-driver` | 8082 | Expo SDK 54 |
| Merchant mobile | `apps/mobile-merchant` | 8083 | Expo SDK 54 |
| Branch mobile | `apps/mobile-branch` | 8084 | Expo SDK 54 |

### 3.2 Shared Infrastructure

| Component | Purpose |
|-----------|---------|
| PostgreSQL | Primary data store (36+ tables) |
| Prisma ORM | Schema management, migrations, seed (Node) |
| Flyway | Schema migrations (Java, V100+) |
| Socket.IO | Realtime order status, GPS, notifications |
| Docker Compose | Local Postgres, Redis, Mailpit, MinIO |

### 3.3 Scale Metrics

| Metric | Count |
|--------|-------|
| User roles | 11 (including BRANCH_STAFF) |
| Permissions | 90+ fine-grained keys |
| API modules | 37 route groups (incl. `/otp`, `/receivers`) |
| Database tables | 36+ |
| Web dashboard sections | 80+ registered features |

---

## 4. Quick Reference

### 4.1 Local URLs

| Service | URL |
|---------|-----|
| Marketing | http://localhost:3001 |
| Web dashboard | http://localhost:3000 |
| Web login | http://localhost:3000/login |
| Node API | http://localhost:4010/api/v1 |
| Node health | http://localhost:4010/api/v1/health |
| Java API | http://localhost:4000/api/v1 |
| Java health | http://localhost:4000/api/v1/health |
| Prisma Studio | http://localhost:5555 (after `npm run db:studio`) |
| Mailpit (Docker) | http://localhost:8025 |

### 4.2 Start Commands

```bash
npm run dev:stop    # Release occupied ports (optional)
npm run dev         # Start entire stack in one terminal
```

### 4.3 Local Development Accounts

Demo users are created by `npm run db:seed`. Configure `SEED_DEMO_PASSWORD` in your local `apps/server/.env` before seeding. Account emails are listed in the seed output and are not published in this documentation.

---

## 5. Reading Guide

| If you need to… | Start with |
|-----------------|------------|
| Install and run locally | [Getting Started](getting-started.md) |
| Understand system design | [Architecture](architecture.md) |
| Integrate with the API | [API Servers](api-servers.md) |
| Work on the web UI | [Web Dashboard](web-dashboard.md) |
| Work on mobile apps | [Mobile Applications](mobile-apps.md) |
| Understand permissions | [Features & Roles](features-and-roles.md) + [Security](security.md) |
| Fix a dev environment issue | [Troubleshooting](troubleshooting.md) |
| See what changed recently | [Changelog](CHANGELOG.md) |

---

## 6. Conventions Used in This Manual

- **Paths** are relative to the repository root unless stated otherwise.
- **Ports** refer to default local development values.
- **API base URL** for Node development is `http://localhost:4010/api/v1`.
- **Role names** in uppercase (e.g. `CUSTOMER`) refer to database/API enum values; lowercase slugs (e.g. `customer`) refer to web dashboard URL segments.
- Commands assume a POSIX shell or PowerShell on Windows unless noted.

---

*End of document index. Proceed to individual chapters for detailed reference material.*
