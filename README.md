<div align="center">

# GUZO

### Enterprise logistics & delivery platform

**Book · Dispatch · Track · Deliver — across web, mobile, and API**

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)
[![Node](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Express](https://img.shields.io/badge/API-Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Next.js](https://img.shields.io/badge/Web-Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Expo](https://img.shields.io/badge/Mobile-Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![Socket.IO](https://img.shields.io/badge/Realtime-Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)

<br/>

**One API · One PostgreSQL database · Six client applications · Realtime tracking**

<br/>

[Overview](#-overview) · [Architecture](#-architecture) · [Applications](#-applications) · [Data layer](#-data-layer) · [API](#-api-server) · [Auth & RBAC](#-authentication--rbac) · [Quick start](#-quick-start) · [Demo logins](#-demo-accounts)

<br/>

[![GitHub](https://img.shields.io/badge/Repository-abel2800%2FGuzo-181717?style=for-the-badge&logo=github)](https://github.com/abel2800/Guzo)

</div>

---

<br/>

## Overview

**GUZO** is a full-stack logistics platform — the kind of system behind Uber Delivery, FedEx, or DHL — built as a **modular monolith** that runs on your machine today and scales to production tomorrow.

Every shipment, GPS ping, payment, notification, and support ticket is stored in **PostgreSQL** and served through a typed **REST API** plus **Socket.IO** realtime channel. Six dedicated clients share the same backend:

| | |
|:---:|:---:|
| **6 applications** | API server · Web dashboard · Marketing site · Customer · Driver · Merchant |
| **36 database tables** | Users, orders, deliveries, payments, tracking, warehouses, support… |
| **28 API modules** | Auth, RBAC, orders, drivers, merchants, analytics, and more |
| **10 user roles** | Admin, customer, driver, merchant, warehouse, finance, support… |
| **90+ permissions** | Fine-grained `resource.action` access control |

### Why GUZO?

| Principle | What it means |
|-----------|---------------|
| **Local-first** | Runs entirely on one machine — no cloud required to develop |
| **Free & open-source stack** | PostgreSQL, Prisma, Express, Next.js, Expo, OpenStreetMap, Socket.IO |
| **Cloud-ready** | Provider abstractions (storage, payments, SMS, push) and clean module boundaries |
| **End-to-end typed** | Shared TypeScript contracts from database → API → web → mobile |
| **Production patterns** | JWT + refresh tokens, RBAC, rate limiting, audit logs, file uploads, background jobs |

---

## Architecture

```mermaid
flowchart TB
    subgraph Clients["🖥️ Client applications"]
        WEB["Web dashboard<br/><sub>Next.js · :3000</sub>"]
        MKT["Marketing site<br/><sub>Next.js · :3001</sub>"]
        CUS["Customer app<br/><sub>Expo · :8081</sub>"]
        DRV["Driver app<br/><sub>Expo · :8082</sub>"]
        MER["Merchant app<br/><sub>Expo · :8083</sub>"]
    end

    subgraph Core["⚙️ Core platform"]
        API["API server<br/><sub>Express + TypeScript · :4000</sub>"]
        RT["Socket.IO<br/><sub>live tracking & notifications</sub>"]
        DB[("PostgreSQL<br/><sub>36 tables · Prisma ORM</sub>")]
    end

    WEB & MKT & CUS & DRV & MER -->|REST /api/v1| API
    WEB & CUS & DRV & MER <-->|realtime| RT
    API --> RT
    API --> DB
```

**Request flow:** Client → Helmet → CORS → body parsing → rate limit → JWT auth → RBAC → module handler → Prisma → PostgreSQL → JSON response (+ Socket.IO broadcast when status changes).

---

## Applications

### 1. API server — `apps/server`

The heart of GUZO. Express + TypeScript modular monolith — each domain is a self-contained module (`routes → controller → service → repository`).

| Capability | Details |
|------------|---------|
| **28 feature modules** | See [API server](#-api-server) section |
| **Auth** | JWT access (15m) + refresh (7d), token rotation, session tracking |
| **Security** | Helmet, CORS, rate limiting, Bcrypt passwords, RBAC middleware |
| **Realtime** | Socket.IO — driver GPS, order status, notifications |
| **Uploads** | Multer — proof of delivery, driver licenses, avatars |
| **Jobs** | Background tasks (e.g. expired token cleanup) |
| **Providers** | Storage (local → S3), payments (fake → Stripe/Chapa), email, SMS, push |
| **Logging** | Winston with size-capped rotation |

**Base URL:** `http://localhost:4000/api/v1` · **Health:** `GET /health`

---

### 2. Web dashboard — `apps/web` · port **3000**

Role-aware Next.js console. Route pattern: `/dashboard/[role]/[section]` — each role sees a tailored workspace with sidebar navigation, command menu, notification center, and light/dark theme.

<table>
<tr>
<td width="50%" valign="top">

#### Admin / Super Admin / Operations

| Section | Feature |
|---------|---------|
| **Orders** | Full order management table |
| **Users** | User administration |
| **Drivers** | Driver list & approval |
| **Analytics** | Platform metrics & charts |
| **Reports** | Operational reports |
| **Support** | Ticket queue |

</td>
<td width="50%" valign="top">

#### Customer

| Section | Feature |
|---------|---------|
| **Book** | Multi-step shipment booking |
| **Orders** | Order history & details |
| **Track** | Live shipment tracking |
| **Addresses** | Saved pickup/dropoff addresses |
| **Invoices** | Billing history |
| **Support** | Open support tickets |

</td>
</tr>
<tr>
<td valign="top">

#### Driver

| Section | Feature |
|---------|---------|
| **Available** | Browse open delivery jobs |
| **Accepted** | Active & completed deliveries |
| **POD** | Proof-of-delivery history |

Includes live **Leaflet + OpenStreetMap** tracking map.

</td>
<td valign="top">

#### Merchant

| Section | Feature |
|---------|---------|
| **Orders** | Shipment management |
| **Bulk upload** | CSV/batch order creation |
| **Analytics** | Shipping metrics |

</td>
</tr>
<tr>
<td valign="top">

#### Warehouse / Warehouse Manager

| Section | Feature |
|---------|---------|
| **Incoming** | Receive packages |
| **Inventory** | Shelf & zone management |
| **Dispatch** | Outbound dispatch queue |

</td>
<td valign="top">

#### Finance

| Section | Feature |
|---------|---------|
| **Payments** | Transaction ledger |
| **Invoices** | Issued invoices |
| **Refunds** | Refund processing |
| **Revenue** | Revenue reports |

</td>
</tr>
<tr>
<td colspan="2" valign="top">

#### Support

**Tickets** · **Notifications** · threaded ticket conversations with internal notes

</td>
</tr>
</table>

---

### 3. Marketing site — `apps/marketing` · port **3001**

Public-facing website for GUZO with premium design (3D hero scene, animations, responsive layout).

| Page | Content |
|------|---------|
| **Home** | Hero, services, how-it-works, stats, testimonials, partners, newsletter |
| **Services** | Delivery service tiers |
| **Pricing** | Transparent pricing plans |
| **Tracking** | Interactive tracking demo |
| **Drivers** | Driver recruitment + earnings calculator |
| **Merchants** | Business onboarding info |
| **Download** | App download hub (iOS / Android) |
| **About · Careers · Press · Investors · FAQ · Contact** | Company pages |
| **Privacy · Terms** | Legal pages |

---

### 4. Customer mobile app — `apps/mobile-customer` · Expo **:8081**

Premium mobile experience (Uber Eats / DoorDash style) with glass UI, gradient buttons, and floating tab bar.

| Tab / Screen | What you do |
|--------------|-------------|
| **Home** | Active orders, quick actions, promos |
| **Book** | 4-step delivery wizard (pickup → dropoff → package → confirm) |
| **Orders** | Order list + detail (`order/[id]`) |
| **Track** | Live map tracking by reference (`track/[ref]`) |
| **Alerts** | Notification timeline |
| **Profile** | Account settings, sign out |
| **Login** | Email/password + biometric unlock (Face ID / fingerprint) |

**Extras:** offline support · push notifications · Socket.IO realtime · deep links

---

### 5. Driver mobile app — `apps/mobile-driver` · Expo **:8082**

Built for couriers on the road — accept jobs, navigate, ping GPS, and capture proof of delivery.

| Tab / Screen | What you do |
|--------------|-------------|
| **Jobs** | Browse & accept available deliveries |
| **Active** | In-progress delivery list |
| **Delivery** (`delivery/[id]`) | Status updates, GPS pings every 15s, live map |
| **POD** | Upload delivery photo + signature |
| **Profile** | Earnings, settings, sign out |
| **Login** | Role-validated — only **DRIVER** accounts allowed |

**Extras:** offline GPS queue (syncs when back online) · biometric login · push notifications · maps integration

---

### 6. Merchant mobile app — `apps/mobile-merchant` · Expo **:8083**

Ship at scale from your phone — same API as the web merchant console.

| Tab / Screen | What you do |
|--------------|-------------|
| **Dashboard** | Shipment stats & overview |
| **Create** | Single order creation form |
| **Bulk** | Batch upload multiple orders |
| **Orders** | Order management list |
| **Profile** | Business settings, sign out |
| **Login** | Role-validated — only **MERCHANT** accounts allowed |

---

## Order lifecycle

Every shipment follows a defined state machine — visible to customers, drivers, and ops staff in realtime via Socket.IO.

```mermaid
stateDiagram-v2
    [*] --> DRAFT
    DRAFT --> PENDING_PAYMENT
    PENDING_PAYMENT --> CONFIRMED
    CONFIRMED --> ASSIGNED: driver accepts
    ASSIGNED --> PICKED_UP
    PICKED_UP --> IN_TRANSIT
    IN_TRANSIT --> AT_WAREHOUSE
    AT_WAREHOUSE --> OUT_FOR_DELIVERY
    OUT_FOR_DELIVERY --> DELIVERED
    DELIVERED --> [*]
    CONFIRMED --> CANCELLED
    OUT_FOR_DELIVERY --> FAILED
    FAILED --> RETURNED
```

---

## Features

<table>
<tr>
<td align="center" width="20%"><br/>📍<br/><b>Live GPS tracking</b><br/><sub>Driver pings + Socket.IO broadcast</sub><br/><br/></td>
<td align="center" width="20%"><br/>📸<br/><b>Proof of delivery</b><br/><sub>Photo + digital signature</sub><br/><br/></td>
<td align="center" width="20%"><br/>🔐<br/><b>RBAC security</b><br/><sub>10 roles · 90+ permissions</sub><br/><br/></td>
<td align="center" width="20%"><br/>💳<br/><b>Payments & billing</b><br/><sub>Wallets · invoices · coupons</sub><br/><br/></td>
<td align="center" width="20%"><br/>🏭<br/><b>Warehouse ops</b><br/><sub>Receive · inventory · dispatch</sub><br/><br/></td>
</tr>
<tr>
<td align="center"><br/>🎫<br/><b>Support tickets</b><br/><sub>Threaded help desk</sub><br/><br/></td>
<td align="center"><br/>📱<br/><b>Offline mobile</b><br/><sub>Queued GPS when no network</sub><br/><br/></td>
<td align="center"><br/>🗺️<br/><b>Free maps</b><br/><sub>OpenStreetMap + OSRM routing</sub><br/><br/></td>
<td align="center"><br/>🔔<br/><b>Notifications</b><br/><sub>In-app · push · email · SMS</sub><br/><br/></td>
<td align="center"><br/>⭐<br/><b>Reviews & ratings</b><br/><sub>Driver · order · merchant · platform</sub><br/><br/></td>
</tr>
<tr>
<td align="center"><br/>📦<br/><b>Bulk shipping</b><br/><sub>Merchant batch order upload</sub><br/><br/></td>
<td align="center"><br/>🧾<br/><b>Audit logs</b><br/><sub>Every change tracked</sub><br/><br/></td>
<td align="center"><br/>🔑<br/><b>Biometric login</b><br/><sub>Face ID / fingerprint on mobile</sub><br/><br/></td>
<td align="center"><br/>📊<br/><b>Analytics</b><br/><sub>Admin · merchant · finance dashboards</sub><br/><br/></td>
<td align="center"><br/>🌐<br/><b>Multi-client</b><br/><sub>Web + 3 mobile apps + API</sub><br/><br/></td>
</tr>
</table>

---

## Data layer

Everything flows through **PostgreSQL** via **Prisma** — one schema, one client, shared by the API and every app.

```mermaid
erDiagram
    User ||--o{ UserRole : has
    Role ||--o{ UserRole : grants
    Role ||--o{ RolePermission : has
    Permission ||--o{ RolePermission : maps
    User ||--o| Customer : profile
    User ||--o| Driver : profile
    User ||--o| Merchant : profile
    Customer ||--o{ Order : places
    Merchant ||--o{ Order : ships
    Order ||--|| Delivery : fulfilled_by
    Driver ||--o{ Delivery : handles
    Order ||--o{ Package : contains
    Order ||--o{ TrackingEvent : timeline
    Order ||--o| Payment : billed
    Order ||--o| Invoice : invoiced
    Driver ||--o{ GpsLocation : pings
    Driver ||--o{ Vehicle : drives
    Warehouse ||--o{ WarehouseInventory : stores
```

### `packages/database`

| Path | Purpose |
|------|---------|
| `prisma/schema.prisma` | Single source of truth — all models, enums, relations |
| `prisma/migrations/` | Versioned SQL migrations |
| `prisma/seed.ts` | Roles, permissions, demo accounts, warehouse, pricing, coupons |

<details>
<summary><b>All 36 tables by domain</b></summary>

<br/>

| Domain | Tables |
|--------|--------|
| **Identity & access** | `users` · `roles` · `permissions` · `user_roles` · `role_permissions` · `sessions` · `refresh_tokens` |
| **Profiles** | `customers` · `drivers` · `merchants` · `merchant_api_keys` |
| **Addresses** | `addresses` |
| **Logistics** | `warehouses` · `warehouse_inventory` · `vehicles` |
| **Orders & fulfilment** | `orders` · `packages` · `deliveries` · `tracking_events` · `gps_locations` |
| **Pricing & promos** | `pricing_rules` · `coupons` · `coupon_usages` |
| **Money** | `payments` · `invoices` · `wallet_transactions` |
| **Engagement** | `notifications` · `push_devices` · `reviews` · `support_tickets` · `ticket_messages` |
| **System** | `files` · `settings` · `audit_logs` · `activity_logs` |

</details>

<details>
<summary><b>Seed data (runs with npm run db:seed)</b></summary>

<br/>

| Data | Details |
|------|---------|
| **10 roles** | SUPER_ADMIN · ADMIN · OPERATIONS_MANAGER · WAREHOUSE_MANAGER · WAREHOUSE_STAFF · DRIVER · MERCHANT · CUSTOMER · SUPPORT · FINANCE |
| **90 permissions** | Fine-grained keys like `orders.create`, `payments.read`, `tracking.create` |
| **10 demo users** | One per role — see [Demo accounts](#-demo-accounts) |
| **Warehouse** | Addis Central Hub (`WH-ADD-001`) |
| **Pricing rules** | Standard · Express · Same-day |
| **Coupon** | `WELCOME10` — 10% off, max 100 ETB |
| **Vehicle** | Driver motorcycle Bajaj Boxer (`AA-12345`) |
| **Support ticket** | Demo ticket with threaded messages |
| **Customer addresses** | Home + office for demo customer |

</details>

### Database commands

```bash
npm run db:generate    # generate Prisma client
npm run db:migrate     # apply migrations → create all tables
npm run db:seed        # roles, permissions, demo data
npm run db:studio      # browse data in Prisma Studio
```

> Set `DATABASE_URL` in your local `apps/server/.env` — env files are never committed.

---

## API server

### Response format

All endpoints return a standard envelope:

```jsonc
// success
{ "success": true, "message": "...", "data": { }, "meta": { } }

// error
{ "success": false, "message": "...", "errorCode": "...", "errors": [] }
```

### Auth endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Create account |
| `POST` | `/auth/login` | Get access + refresh tokens |
| `POST` | `/auth/refresh` | Rotate access token |
| `POST` | `/auth/logout` | Revoke refresh token |
| `GET` | `/auth/me` | Current user profile (auth required) |
| `POST` | `/auth/forgot-password` | Start password reset |
| `POST` | `/auth/reset-password` | Complete password reset |

### Key order endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/orders/quote` | Public | Price quote (no auth) |
| `GET` | `/orders/track/:ref` | Public | Track by reference |
| `POST` | `/orders` | Customer | Create order |
| `POST` | `/orders/bulk` | Merchant | Bulk create |
| `GET` | `/orders` | Auth | List orders (scoped by role) |
| `GET` | `/orders/:id` | Auth | Order detail |
| `POST` | `/orders/:id/accept` | Driver | Accept delivery |
| `PATCH` | `/orders/:id/status` | Driver/Ops | Update status |
| `POST` | `/orders/:id/pod` | Driver | Upload proof of delivery |
| `POST` | `/orders/:id/cancel` | Auth | Cancel order |
| `POST` | `/orders/:id/assign` | Admin/Ops | Assign driver |

<details>
<summary><b>All 28 API modules</b></summary>

<br/>

| Route prefix | Responsibility |
|--------------|----------------|
| `/auth` | Authentication & sessions |
| `/users` | User management |
| `/roles` · `/permissions` | RBAC administration |
| `/customers` · `/drivers` · `/merchants` | Profile management |
| `/addresses` | Reusable pickup/dropoff addresses |
| `/warehouses` | Warehouse + inventory |
| `/vehicles` | Driver vehicles |
| `/orders` | Order lifecycle, quote, accept, POD, cancel |
| `/packages` | Package-level tracking |
| `/deliveries` | Delivery assignment & lifecycle |
| `/tracking` | Tracking events + live GPS |
| `/pricing` | Pricing rules & quotes |
| `/coupons` | Discount codes |
| `/payments` · `/invoices` | Payments & billing |
| `/notifications` · `/push-tokens` | Alerts & device registration |
| `/reviews` | Ratings & reviews |
| `/support` | Support tickets & messages |
| `/settings` | Global/user/merchant settings |
| `/reports` · `/analytics` · `/dashboard` | Metrics & reporting |
| `/search` | Cross-entity search |
| `/admin` | Admin-only operations |

</details>

---

## Authentication & RBAC

### Token flow

- **Access token** — JWT, expires in 15 minutes
- **Refresh token** — stored hashed in DB, expires in 7 days, rotated on use
- Mobile client **auto-refreshes** on 401 responses

### Roles

| Role | Purpose |
|------|---------|
| `SUPER_ADMIN` | Full access — bypasses all permission checks |
| `ADMIN` | Platform administration |
| `OPERATIONS_MANAGER` | Order/driver/warehouse orchestration |
| `WAREHOUSE_MANAGER` | Warehouse domain management |
| `WAREHOUSE_STAFF` | Package receive/sort/dispatch |
| `DRIVER` | Accept deliveries, update status, upload POD |
| `MERCHANT` | Create orders, bulk upload |
| `CUSTOMER` | Book & track shipments |
| `SUPPORT` | Handle support tickets |
| `FINANCE` | Payments, invoices, revenue |

### Permissions

Fine-grained `resource.action` keys (e.g. `orders.create`, `payments.read`) mapped to roles. Enforced via middleware:

```
authenticate → authorize(...roles) → authorizePermission(...keys) → handler
```

---

## Realtime (Socket.IO)

| Event | Direction | Purpose |
|-------|-----------|---------|
| `driver:location` | Driver → Server → Clients | Live GPS position |
| `order:status` | Server → Clients | Order status change |
| `order:tracking` | Server → Clients | Tracking timeline update |
| `driver:status` | Server → Clients | Online / offline / on-delivery |
| `notification:new` | Server → User | New notification |
| `chat:message` | Bidirectional | Support chat |
| `admin:metrics` | Server → Admin | Live dashboard stats |

Event names are defined in `@delivery/types` (`SOCKET_EVENTS`).

---

## Shared packages

| Package | NPM name | Purpose |
|---------|----------|---------|
| `packages/database` | `@delivery/database` | Prisma schema, client, migrations, seed |
| `packages/types` | `@delivery/types` | API contracts, enums, socket events |
| `packages/utils` | — | Isomorphic utility helpers |
| `packages/config` | — | Shared constants & config |
| `packages/ui` | — | Shared web React/Shadcn components |
| `packages/mobile-shared` | `@guzo/mobile-shared` | Mobile API client, auth, offline queue, sockets |
| `packages/mobile-ui` | `@guzo/mobile-ui` | Premium mobile design system (GlassCard, GradientButton, FloatingTabBar, LiveTrackingMap) |

---

## Tech stack

<div align="center">

| Backend | Web | Mobile | Data & infra |
|---------|-----|--------|--------------|
| Node.js 20+ · Express · TypeScript | Next.js · React · Tailwind CSS | Expo SDK 54 · React Native | PostgreSQL · Prisma ORM |
| JWT + refresh · Bcrypt · Helmet | React Query · Zod · React Hook Form | Expo Router · React Query | Socket.IO · optional Redis |
| Multer · Winston · Nodemailer | Leaflet · OpenStreetMap · Framer Motion | Secure Store · Biometrics · Location | Docker Compose · npm workspaces |
| Socket.IO · express-validator | Shadcn UI · dark/light theme | Offline queue · push notifications | EAS builds · ESLint · Prettier |

</div>

| Integration | Technology | Cost |
|-------------|------------|------|
| **Maps** | OpenStreetMap + Leaflet + OSRM + Nominatim | Free |
| **Storage** | Local filesystem (abstracted → S3/MinIO) | Free locally |
| **Payments** | Fake provider (abstracted → Stripe/Chapa/Telebirr) | Free in dev |
| **Email** | Console / SMTP / Mailpit | Free in dev |
| **SMS / Push** | Console / Expo Push API | Free in dev |

---

## Monorepo layout

```
Guzo/
├── apps/
│   ├── server/              # Express API — 28 modules, Socket.IO, jobs
│   ├── web/                 # Next.js role-based web dashboard
│   ├── marketing/           # Next.js public marketing site
│   ├── mobile-customer/     # Expo — customer app
│   ├── mobile-driver/       # Expo — driver app
│   └── mobile-merchant/     # Expo — merchant app
├── packages/
│   ├── database/            # Prisma schema, migrations, seed
│   ├── types/               # Shared API contracts
│   ├── mobile-shared/       # Mobile API client & auth
│   ├── mobile-ui/           # Premium mobile design system
│   ├── ui/                  # Shared web components
│   ├── utils/ · config/
├── docker/                  # Postgres · Redis · Mailpit · MinIO
└── scripts/                 # Mobile dev, EAS builds, git helpers
```

---

## Quick start

**Prerequisites:** Node.js 20+ · PostgreSQL (or `npm run docker:up`)

```bash
# 1. Clone & install
git clone https://github.com/abel2800/Guzo.git
cd Guzo
npm install

# 2. Configure database (create apps/server/.env locally — never committed)
#    DATABASE_URL=postgresql://USER:PASS@localhost:5432/Guzo?schema=public

# 3. Initialize database
npm run db:generate
npm run db:migrate
npm run db:seed

# 4. Start the API
npm run dev:server
# → http://localhost:4000/api/v1
# → http://localhost:4000/health
```

---

## Run everything

| Application | Command | URL / Port |
|-------------|---------|------------|
| **API server** | `npm run dev:server` | http://localhost:4000 |
| **Web dashboard** | `npm run dev:web` | http://localhost:3000 |
| **Marketing site** | `npm run dev:marketing` | http://localhost:3001 |
| **Customer app** | `npm run dev:mobile-customer` | Expo `:8081` |
| **Driver app** | `npm run dev:mobile-driver` | Expo `:8082` |
| **Merchant app** | `npm run dev:mobile-merchant` | Expo `:8083` |
| **All mobile + API** | `npm run dev:mobile:phone` | Starts API + 3 Expo apps for phone testing |

For physical phone testing: scan the QR code in each Expo window with **Expo Go**, or set `EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:4000/api/v1`.

<details>
<summary><b>Environment variables</b></summary>

<br/>

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment |
| `PORT` | `4000` | API port |
| `DATABASE_URL` | — | PostgreSQL connection (**required**) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | dev values | Token secrets (**change in prod**) |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | `15m` / `7d` | Token lifetimes |
| `CORS_ORIGINS` | localhost list | Allowed frontend origins |
| `REDIS_ENABLED` | `false` | Optional Redis |
| `STORAGE_DRIVER` / `UPLOAD_DIR` | `local` / `uploads` | File storage |
| `EMAIL_DRIVER` / `SMTP_*` | `console` | Email delivery |
| `PAYMENT_PROVIDER` | `fake` | Payment provider |
| `SMS_DRIVER` / `PUSH_DRIVER` | `console` | SMS/push providers |
| `OSRM_BASE_URL` / `NOMINATIM_BASE_URL` | public OSM | Maps/routing |
| `LOG_LEVEL` | `debug` | Logging verbosity |

Mobile: `EXPO_PUBLIC_API_URL` — your LAN IP when testing on a physical phone.

</details>

<details>
<summary><b>All npm scripts</b></summary>

<br/>

| Category | Scripts |
|----------|---------|
| **Development** | `dev:server` · `dev:web` · `dev:marketing` · `dev:mobile-customer` · `dev:mobile-driver` · `dev:mobile-merchant` · `dev:mobile:phone` |
| **Database** | `db:generate` · `db:migrate` · `db:seed` · `db:studio` |
| **Quality** | `lint` · `format` · `typecheck:mobile` · `build` |
| **Mobile builds** | `build:mobile:android` · `build:mobile:ios` · `build:mobile:all` · `copy:mobile-builds` |
| **EAS** | `eas:customer:preview` · `eas:driver:preview` · `eas:merchant:preview` · `eas:setup` |
| **Docker** | `docker:up` · `docker:down` |

</details>

---

## Demo accounts

Password for **all** accounts: **`Password123!`**

| Email | Role | Best for testing |
|-------|------|------------------|
| `customer@delivery.local` | Customer | Book & track orders (web + mobile) |
| `driver@delivery.local` | Driver | Accept jobs & upload POD (web + mobile) |
| `merchant@delivery.local` | Merchant | Create & bulk orders (web + mobile) |
| `admin@delivery.local` | Admin | Full web dashboard |
| `superadmin@delivery.local` | Super admin | All permissions |

<details>
<summary><b>All demo accounts</b></summary>

<br/>

| Email | Role |
|-------|------|
| `ops@delivery.local` | Operations manager |
| `warehouse.manager@delivery.local` | Warehouse manager |
| `warehouse.staff@delivery.local` | Warehouse staff |
| `support@delivery.local` | Support |
| `finance@delivery.local` | Finance |

</details>

---

<div align="center">

<br/>

### Built as a modular monolith

Run locally today · Scale to the cloud tomorrow · MIT licensed

<br/>

[![GitHub](https://img.shields.io/badge/GitHub-abel2800%2FGuzo-181717?style=for-the-badge&logo=github)](https://github.com/abel2800/Guzo)

<br/>

**GUZO** — Logistics & delivery, done right.

</div>
