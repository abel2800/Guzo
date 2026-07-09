# Chapter 8 — Database

| Field | Value |
|-------|-------|
| **Chapter** | 8 of 12 |
| **Title** | Database Schema and Operations |
| **Engine** | PostgreSQL 14+ |
| **ORM** | Prisma (Node) / JPA (Java) |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Schema Management](#2-schema-management)
3. [Table Reference](#3-table-reference)
4. [Enumerations](#4-enumerations)
5. [Seed Data](#5-seed-data)
6. [Commands Reference](#6-commands-reference)
7. [Migration Strategy](#7-migration-strategy)

---

## 1. Overview

GUZO uses a single PostgreSQL database as the source of truth for all applications. The schema is defined in `packages/database/prisma/schema.prisma` and contains 36+ tables organized into domain groups.

| Attribute | Value |
|-----------|-------|
| Default database name | `Guzo` |
| Default Docker port | 5433 |
| Schema name | `public` |
| Connection string format | Prisma `postgresql://` scheme (configure locally in `.env`) |

---

## 2. Schema Management

### 2.1 Prisma (Node — Primary)

| File | Purpose |
|------|---------|
| `packages/database/prisma/schema.prisma` | Model definitions, enums, relations |
| `packages/database/prisma/migrations/` | Versioned SQL migrations |
| `packages/database/prisma/migrations-manual/` | Manual DDL for complex phases |
| `packages/database/prisma/seed.ts` | Demo data insertion |

### 2.2 Flyway (Java)

| Path | Purpose |
|------|---------|
| `apps/guzo-api/src/main/resources/db/migration/` | Flyway migrations V1–V106+ |
| `V100+` | Branch network, manifests, phases 5–7 |

Both migration paths target the same physical tables. Prisma is the schema authority during development; Java Flyway mirrors changes for production deployments.

---

## 3. Table Reference

### 3.1 Identity & Access

| Table | Description |
|-------|-------------|
| `users` | Core user accounts (email, password hash, profile) |
| `roles` | Role definitions (SUPER_ADMIN, CUSTOMER, etc.) |
| `permissions` | Fine-grained permission keys |
| `user_roles` | User-to-role assignments (many-to-many) |
| `role_permissions` | Role-to-permission mappings |
| `sessions` | Active user sessions |
| `refresh_tokens` | Hashed refresh token storage |

### 3.2 Profiles

| Table | Description |
|-------|-------------|
| `customers` | Customer profile extension |
| `drivers` | Driver profile (license, status, rating) |
| `merchants` | Merchant business profile |
| `merchant_api_keys` | API keys for merchant integrations |
| `branch_staff` | Branch staff assignments |

### 3.3 Addresses & Geography

| Table | Description |
|-------|-------------|
| `addresses` | Reusable pickup/delivery addresses |
| `city_zones` | Delivery zone polygons and pricing |

### 3.4 Logistics Core

| Table | Description |
|-------|-------------|
| `orders` | Shipment orders with status state machine |
| `packages` | Individual packages within orders |
| `deliveries` | Driver assignment and delivery lifecycle |
| `tracking_events` | Status timeline entries |
| `gps_locations` | Driver GPS ping history |

### 3.5 Warehouse & Transport

| Table | Description |
|-------|-------------|
| `warehouses` | Warehouse facilities |
| `warehouse_inventory` | Items in warehouse storage |
| `vehicles` | Fleet vehicles |
| `vehicle_logs` | Fuel, maintenance, inspection records |
| `manifests` | Transport manifests |
| `manifest_packages` | Packages on a manifest |

### 3.6 Branch Network

| Table | Description |
|-------|-------------|
| `branches` | Branch office locations |
| `branch_inventory` | Packages held at branches |
| `shelf_assignments` | Package-to-shelf mappings |

### 3.7 Financial

| Table | Description |
|-------|-------------|
| `payments` | Payment transactions |
| `invoices` | Billing documents |
| `wallet_transactions` | Customer wallet ledger |
| `pricing_rules` | Service tier pricing |
| `coupons` | Discount codes |
| `coupon_usages` | Coupon redemption history |

### 3.8 Engagement & Support

| Table | Description |
|-------|-------------|
| `notifications` | In-app notifications |
| `push_devices` | Registered push notification devices |
| `reviews` | Ratings for drivers, orders, merchants |
| `support_tickets` | Help desk tickets |
| `ticket_messages` | Threaded ticket conversations |
| `loyalty_points` | Customer loyalty balances |
| `insurance_claims` | Package insurance claims |

### 3.9 System

| Table | Description |
|-------|-------------|
| `files` | Uploaded file metadata |
| `settings` | Global and per-entity settings |
| `audit_logs` | Security-sensitive change log |
| `activity_logs` | General activity tracking |

---

## 4. Enumerations

### 4.1 Order Status

```
DRAFT → PENDING_PAYMENT → CONFIRMED → ASSIGNED → PICKED_UP → IN_TRANSIT
  → AT_WAREHOUSE → OUT_FOR_DELIVERY → DELIVERED
  (branches: AT_BRANCH, AT_DESTINATION_BRANCH)
  (terminal: CANCELLED, FAILED, RETURNED)
```

### 4.2 User Roles

| Enum Value | Dashboard Slug |
|------------|----------------|
| SUPER_ADMIN | super-admin |
| ADMIN | admin |
| OPERATIONS_MANAGER | operations |
| WAREHOUSE_MANAGER | warehouse-manager |
| WAREHOUSE_STAFF | warehouse |
| BRANCH_STAFF | branch |
| DRIVER | driver |
| MERCHANT | merchant |
| CUSTOMER | customer |
| SUPPORT | support |
| FINANCE | finance |

### 4.3 Pickup Methods

| Value | Description |
|-------|-------------|
| COMPANY_PICKUP | Driver collects from sender |
| DROP_AT_BRANCH | Sender drops at branch |
| BRANCH_PICKUP | Receiver collects at branch |

---

## 5. Seed Data

Running `npm run db:seed` inserts:

| Category | Items |
|----------|-------|
| Roles | 11 roles with permission mappings |
| Permissions | 90+ keys (e.g. `orders.create`, `payments.read`) |
| Users | 11 demo accounts (one per role) |
| Warehouse | Addis Central Hub |
| Branch | Guzo Bole branch with staff assignment |
| Pricing | Standard, Express, Same-day rules |
| Coupon | WELCOME10 (10% off, max 100 ETB) |
| Vehicle | Bajaj Boxer motorcycle for demo driver |
| Ticket | Sample support ticket with messages |
| Addresses | Home + office for demo customer |

---

## 6. Commands Reference

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Regenerate Prisma client after schema changes |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | Insert seed data |
| `npm run db:studio` | Open Prisma Studio GUI |

### 6.1 Reset Database (Development)

```bash
npx prisma migrate reset --schema packages/database/prisma/schema.prisma
```

This drops all data, reapplies migrations, and runs the seed script.

---

## 7. Migration Strategy

| Phase | Prisma Migration | Java Flyway | Scope |
|-------|-----------------|-------------|-------|
| Init | 20260630190928_init | V1–V99 | Core tables |
| Phase 2 | 20260707230000_phase2_branches | V100 | Branch network |
| Phase 3 | 20260708180000_phase3_vehicle_logs | V101+ | Vehicle logs |
| Phase 4 | 20260707220000_phase4_manifests | V102+ | Manifests |
| Phase 5–7 | migrations-manual/phase5_6_7_unified.sql | V106+ | Admin, merchant, cross-cutting |

When adding new tables, update `schema.prisma`, create a Prisma migration, and add the corresponding Flyway script for Java parity.

---

*End of Chapter 8.*
