# Chapter 2 — Architecture

| Field | Value |
|-------|-------|
| **Chapter** | 2 of 12 |
| **Title** | System Architecture |

---

## Table of Contents

1. [Architectural Overview](#1-architectural-overview)
2. [Design Principles](#2-design-principles)
3. [Client Tier](#3-client-tier)
4. [Application Tier](#4-application-tier)
5. [Data Tier](#5-data-tier)
6. [Realtime Layer](#6-realtime-layer)
7. [Shared Packages](#7-shared-packages)
8. [Request Lifecycle](#8-request-lifecycle)
9. [Dual Backend Strategy](#9-dual-backend-strategy)
10. [Monorepo Layout](#10-monorepo-layout)
11. [Integration Points](#11-integration-points)

---

## 1. Architectural Overview

GUZO follows a **modular monolith** pattern: one deployable backend (per stack) with clearly separated domain modules, one PostgreSQL database, and multiple client applications that consume the same API contracts.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                               │
│  Web Dashboard │ Marketing │ Customer │ Driver │ Merchant │ Branch│
└────────────┬────────────────────────────────────────┬───────────┘
             │ REST /api/v1                            │ Socket.IO
┌────────────▼────────────────────────────────────────▼───────────┐
│                     APPLICATION TIER                             │
│         Node API (Express)          Java API (Spring Boot)       │
│              :4010                         :4000                  │
└────────────┬────────────────────────────────────────┬───────────┘
             │                                         │
┌────────────▼─────────────────────────────────────────▼───────────┐
│                         DATA TIER                               │
│                    PostgreSQL (Prisma + Flyway)                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Design Principles

| Principle | Implementation |
|-----------|----------------|
| Local-first development | Entire stack runs on one machine without cloud dependencies |
| End-to-end typing | Shared `@delivery/types` package across API, web, and mobile |
| Provider abstraction | Storage, payments, email, SMS, push are swappable via interfaces |
| Role-based access | JWT authentication + RBAC middleware on every protected route |
| Auditability | Activity logs and audit logs on sensitive operations |
| Offline resilience | Mobile apps queue mutations and GPS when network is unavailable |
| Cloud readiness | Clean module boundaries enable future service extraction |

---

## 3. Client Tier

### 3.1 Web Dashboard (`apps/web`)

| Attribute | Value |
|-----------|-------|
| Framework | Next.js 15 (App Router) |
| Port | 3000 |
| Auth | JWT stored in client; auto-refresh on 401 |
| Routing | `/dashboard/[role]/[section]` |
| UI | Tailwind CSS, Shadcn components, glass morphism design |

The web dashboard serves all internal and business roles: admin, operations, warehouse, branch, finance, support, customer, driver, and merchant. Each role receives a tailored sidebar navigation and overview endpoint.

### 3.2 Marketing Site (`apps/marketing`)

| Attribute | Value |
|-----------|-------|
| Framework | Next.js |
| Port | 3001 |
| Auth | None (public) |
| Notable features | Three.js 3D city hero, iPhone platform showcase, public tracking |

### 3.3 Mobile Applications

| App | Port | Primary User |
|-----|------|--------------|
| mobile-customer | 8081 | End customers |
| mobile-driver | 8082 | Couriers |
| mobile-merchant | 8083 | Business shippers |
| mobile-branch | 8084 | Branch counter staff |

All mobile apps use Expo SDK 54, Expo Router for navigation, and shared packages `@guzo/mobile-shared` and `@guzo/mobile-ui`.

---

## 4. Application Tier

### 4.1 Node API (`apps/server`)

The primary development API. Built with Express and TypeScript.

| Layer | Responsibility |
|-------|----------------|
| Routes | HTTP endpoint definitions, middleware chain |
| Controllers | Request parsing, response formatting |
| Services | Business logic, orchestration |
| Repositories | Prisma data access |
| Validators | Input validation (express-validator) |
| Providers | External service adapters (maps, storage, payments) |
| Socket handlers | Realtime event processing |
| Jobs | Background tasks (token cleanup, etc.) |

**Module count:** 35+ route groups registered in `apps/server/src/routes/index.ts`.

### 4.2 Java API (`apps/guzo-api`)

Production-target mirror implemented in Spring Boot.

| Layer | Responsibility |
|-------|----------------|
| Controllers | REST endpoints (`et.guzo.web.controller`) |
| Services | Business logic (`et.guzo.service`) |
| Repositories | JPA data access (`et.guzo.repository`) |
| Domain | Entities and enums (`et.guzo.domain`) |
| Security | JWT filter, Spring Security config |
| Flyway | Database migrations (V100 onward) |

Phases P5 (admin), P6 (merchant platform), and P7 (cross-cutting) are fully ported with corresponding integration tests.

---

## 5. Data Tier

### 5.1 PostgreSQL

Single database shared by both APIs. Schema is defined in `packages/database/prisma/schema.prisma` and applied via:

- **Prisma migrations** — primary path for Node development
- **Flyway migrations** — Java path starting at V100
- **Manual SQL** — `packages/database/prisma/migrations-manual/` for unified DDL

### 5.2 Key Domain Groups

| Domain | Tables (examples) |
|--------|-------------------|
| Identity | users, roles, permissions, sessions, refresh_tokens |
| Profiles | customers, drivers, merchants, branch_staff |
| Logistics | orders, packages, deliveries, tracking_events, gps_locations |
| Warehouse | warehouses, warehouse_inventory, manifests |
| Branch network | branches, branch_inventory, shelf_assignments |
| Financial | payments, invoices, wallet_transactions, coupons |
| Engagement | notifications, reviews, support_tickets, loyalty |

See [Database](database.md) for the complete table reference.

---

## 6. Realtime Layer

Socket.IO provides bidirectional communication for:

| Event category | Examples |
|----------------|----------|
| Order updates | Status transitions, tracking timeline |
| Driver location | GPS pings every 15 seconds during active delivery |
| Notifications | New in-app alerts |
| Presence | Driver online/offline status |
| Admin metrics | Live dashboard statistics |

Event names are defined in `packages/types` as `SOCKET_EVENTS` constants. Clients join order-specific rooms after authentication.

---

## 7. Shared Packages

| Package | NPM Name | Consumers |
|---------|----------|-----------|
| `packages/database` | `@delivery/database` | Node API |
| `packages/types` | `@delivery/types` | API, web, mobile |
| `packages/config` | — | All apps |
| `packages/utils` | — | API, web |
| `packages/ui` | — | Web dashboard |
| `packages/mobile-shared` | `@guzo/mobile-shared` | All mobile apps |
| `packages/mobile-ui` | `@guzo/mobile-ui` | All mobile apps |

---

## 8. Request Lifecycle

A typical authenticated API request follows this pipeline:

```
HTTP Request
  → Helmet (security headers)
  → CORS
  → Body parser (JSON)
  → Rate limiter (auth routes)
  → Request context (correlation ID)
  → authenticate (JWT verification)
  → authorize (role check)
  → authorizePermission (fine-grained check)
  → validate (input schema)
  → Controller handler
  → Service layer
  → Repository (Prisma)
  → PostgreSQL
  → ApiResponse JSON envelope
  → (optional) Socket.IO broadcast
```

### 8.1 Response Envelope

```json
{
  "success": true,
  "message": "Operation completed",
  "data": { },
  "meta": { "page": 1, "limit": 20, "total": 100 }
}
```

Error responses include `errorCode` and `errors[]` for validation failures.

---

## 9. Dual Backend Strategy

| Aspect | Node API | Java API |
|--------|----------|----------|
| Port | 4010 | 4000 |
| Primary use | Day-to-day development | Production deployment target |
| ORM | Prisma | JPA/Hibernate |
| Migrations | Prisma migrate | Flyway V100+ |
| Health endpoint | GET /api/v1/health | GET /api/v1/health |
| Test scripts | test-phase{N}-node.ps1 | test-phase{N}-java.ps1 |

Clients select the backend via `NEXT_PUBLIC_API_URL` (web) or `EXPO_PUBLIC_API_URL` (mobile). Both APIs operate on the same schema and return compatible response envelopes.

---

## 10. Monorepo Layout

```
Guzo/
├── apps/
│   ├── server/              Node/Express API
│   ├── guzo-api/            Java/Spring Boot API
│   ├── web/                 Web dashboard (Next.js)
│   ├── marketing/           Marketing site (Next.js)
│   ├── mobile-customer/     Customer Expo app
│   ├── mobile-driver/       Driver Expo app
│   ├── mobile-merchant/     Merchant Expo app
│   └── mobile-branch/       Branch Expo app
├── packages/
│   ├── database/            Prisma schema, migrations, seed
│   ├── types/               Shared TypeScript contracts
│   ├── config/              Shared constants
│   ├── utils/               Utility functions
│   ├── ui/                  Web component library
│   ├── mobile-shared/       Mobile API client, auth, offline
│   └── mobile-ui/           Mobile design system
├── assets/
│   ├── brand/               Official logo and splash assets
│   └── mobile-qr/           Expo Go QR code images
├── doc/                     This documentation set
├── docker/                  Docker Compose services
└── scripts/                 Dev orchestration, tests, builds
```

---

## 11. Integration Points

| Integration | Technology | Cost (dev) |
|-------------|------------|------------|
| Maps | OpenStreetMap, Leaflet, OSRM, Nominatim | Free |
| File storage | Local filesystem (abstracted to S3/MinIO) | Free locally |
| Payments | Fake provider (abstracted to Stripe/Chapa/Telebirr) | Free in dev |
| Email | Console / SMTP / Mailpit | Free in dev |
| SMS | Console / Twilio adapter | Free in dev |
| Push notifications | Expo Push API | Free in dev |
| Barcode/QR | Client-side generation and scanning | Free |

---

*End of Chapter 2.*
