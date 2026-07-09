# Chapter 3 — API Servers

| Field | Value |
|-------|-------|
| **Chapter** | 3 of 12 |
| **Title** | REST API Reference |
| **Base URL (Node)** | `http://localhost:4010/api/v1` |
| **Base URL (Java)** | `http://localhost:4000/api/v1` |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Response Format](#2-response-format)
3. [Authentication](#3-authentication)
4. [Module Registry](#4-module-registry)
5. [Auth Endpoints](#5-auth-endpoints)
6. [Order Endpoints](#6-order-endpoints)
7. [Driver Endpoints](#7-driver-endpoints)
8. [Warehouse & Manifest Endpoints](#8-warehouse--manifest-endpoints)
9. [Branch Endpoints](#9-branch-endpoints)
10. [Merchant Platform Endpoints](#10-merchant-platform-endpoints)
11. [Dashboard Endpoints](#11-dashboard-endpoints)
12. [Support & Finance Endpoints](#12-support--finance-endpoints)
13. [Admin Endpoints](#13-admin-endpoints)
14. [Realtime (Socket.IO)](#14-realtime-socketio)
15. [Provider Abstractions](#15-provider-abstractions)
16. [Java API](#16-java-api)
17. [Testing](#17-testing)

---

## 1. Overview

GUZO exposes two compatible REST APIs sharing one PostgreSQL database:

| API | Stack | Port | Start Command |
|-----|-------|------|---------------|
| Node (primary) | Express + TypeScript + Prisma | 4010 | `npm run dev:server` |
| Java (production) | Spring Boot + JPA + Flyway | 4000 | `npm run dev:server:java` |

Both serve versioned routes under `/api/v1`. The root module index is available at `GET /api/v1/` and returns the list of registered route prefixes.

---

## 2. Response Format

### 2.1 Success

```json
{
  "success": true,
  "message": "Orders retrieved",
  "data": [ ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 2.2 Error

```json
{
  "success": false,
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

### 2.3 HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Validation error |
| 401 | Unauthenticated |
| 403 | Forbidden (RBAC) |
| 404 | Not found |
| 409 | Conflict |
| 429 | Rate limited |
| 500 | Server error |

---

## 3. Authentication

### 3.1 Token Model

| Token | Lifetime | Storage |
|-------|----------|---------|
| Access token | 15 minutes | Authorization header / secure storage |
| Refresh token | 7 days | HttpOnly cookie (web) / secure storage (mobile) |

Mobile and web clients automatically refresh the access token on HTTP 401 responses.

### 3.2 Authorization Header

```
Authorization: Bearer <access_token>
```

### 3.3 Middleware Chain

```
authenticate → authorize(roles) → authorizePermission(keys) → validate → handler
```

`SUPER_ADMIN` bypasses all permission checks.

---

## 4. Module Registry

All modules are composed in `apps/server/src/routes/index.ts`:

| Prefix | Module | Responsibility |
|--------|--------|----------------|
| `/auth` | Authentication | Register, login, refresh, profile |
| `/push-tokens` | Push tokens | Device registration for notifications |
| `/addresses` | Addresses | Saved pickup/delivery addresses |
| `/users` | Users | User CRUD (admin) |
| `/roles` | Roles | Role management |
| `/permissions` | Permissions | Permission management |
| `/customers` | Customers | Customer profiles |
| `/drivers` | Drivers | Driver profiles, jobs, earnings |
| `/merchants` | Merchants | Merchant profiles |
| `/warehouses` | Warehouses | Receive, sort, dispatch, inventory |
| `/manifests` | Manifests | Transport manifests |
| `/branches` | Branches | Branch network CRUD |
| `/branch-staff` | Branch staff | Counter operations |
| `/city-zones` | City zones | Delivery zone configuration |
| `/packages` | Packages | Package-level tracking |
| `/orders` | Orders | Full order lifecycle |
| `/deliveries` | Deliveries | Delivery assignment |
| `/tracking` | Tracking | Events and live GPS |
| `/vehicles` | Vehicles | Fleet vehicle management |
| `/pricing` | Pricing | Pricing rules and quotes |
| `/coupons` | Coupons | Discount codes |
| `/notifications` | Notifications | In-app notification inbox |
| `/payments` | Payments | Payment processing |
| `/invoices` | Invoices | Billing documents |
| `/reviews` | Reviews | Ratings and reviews |
| `/loyalty` | Loyalty | Loyalty points program |
| `/insurance-claims` | Insurance | Package insurance claims |
| `/support` | Support | Tickets and messages |
| `/settings` | Settings | Global and user settings |
| `/reports` | Reports | Operational reports |
| `/analytics` | Analytics | Platform metrics |
| `/dashboard` | Dashboard | Role-specific overview data |
| `/search` | Search | Cross-entity search |
| `/admin` | Admin | Platform administration |
| `/merchant-platform` | Merchant platform | Webhooks, analytics, API keys |
| `/merchant-api` | Merchant API | External merchant integration |
| `/maps` | Maps | Geocoding and routing proxy |

---

## 5. Auth Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | Public | Create new account |
| POST | `/auth/login` | Public | Obtain access + refresh tokens |
| POST | `/auth/refresh` | Public | Rotate access token |
| POST | `/auth/logout` | Public | Revoke refresh token |
| GET | `/auth/me` | Required | Current user profile |
| PATCH | `/auth/me` | Required | Update name, phone, avatar |
| PATCH | `/auth/me/location` | Required | Update user location |
| PATCH | `/auth/me/password` | Required | Change password |
| POST | `/auth/me/avatar` | Required | Upload profile avatar |
| POST | `/auth/forgot-password` | Public | Initiate password reset |
| POST | `/auth/reset-password` | Public | Complete password reset |

---

## 6. Order Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/orders/quote` | Public | Price quote without auth |
| GET | `/orders/track/:ref` | Public | Track by reference number |
| POST | `/orders` | CUSTOMER | Create single order |
| POST | `/orders/bulk` | MERCHANT | Bulk create orders |
| GET | `/orders` | Auth | List orders (scoped by role) |
| GET | `/orders/:id` | Auth | Order detail |
| POST | `/orders/:id/accept` | DRIVER | Accept delivery job |
| PATCH | `/orders/:id/status` | DRIVER, Ops | Update order status |
| POST | `/orders/:id/pod` | DRIVER | Upload proof of delivery |
| POST | `/orders/:id/cancel` | Auth | Cancel order |
| POST | `/orders/:id/assign` | ADMIN, Ops | Assign driver |
| POST | `/orders/:id/pickup-proof` | DRIVER | Upload pickup proof |

---

## 7. Driver Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/drivers/me/route` | DRIVER | Current navigation route |
| GET | `/drivers/me/manifests` | DRIVER | Assigned manifests |
| GET | `/drivers/me/earnings` | DRIVER | Earnings summary |
| GET | `/drivers/me/vehicle` | DRIVER | Assigned vehicle |
| GET | `/drivers/me/vehicle/logs` | DRIVER | Vehicle maintenance logs |
| POST | `/drivers/me/vehicle/logs` | DRIVER | Create vehicle log |
| POST | `/drivers/me/manifests/:id/scan` | DRIVER | Scan manifest package |
| POST | `/drivers/me/manifests/:id/depart` | DRIVER | Depart with manifest |
| POST | `/drivers/me/manifests/:id/arrive` | DRIVER | Arrive at destination |
| POST | `/drivers/me/manifests/:id/unload` | DRIVER | Unload manifest |
| GET | `/drivers` | ADMIN, Ops | List all drivers |
| POST | `/drivers` | ADMIN | Create driver account |
| PATCH | `/drivers/:id` | ADMIN | Update driver |
| DELETE | `/drivers/:id` | ADMIN | Remove driver |

---

## 8. Warehouse & Manifest Endpoints

### 8.1 Warehouses

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/warehouses` | List warehouses |
| GET | `/warehouses/:id` | Warehouse detail |
| GET | `/warehouses/:id/inventory` | Current inventory |
| GET | `/warehouses/:id/stats` | Warehouse statistics |
| GET | `/warehouses/:id/aging` | Aging inventory report |
| GET | `/warehouses/:id/inventory/by-city` | Inventory grouped by city |
| POST | `/warehouses/:id/receive` | Receive incoming packages |
| POST | `/warehouses/:id/sort` | Sort packages |
| POST | `/warehouses/:id/dispatch` | Dispatch outbound |
| POST | `/warehouses/:id/transfer` | Inter-warehouse transfer |

### 8.2 Manifests

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/manifests` | List transport manifests |
| POST | `/manifests` | Create manifest |
| GET | `/manifests/:id` | Manifest detail with packages |
| PATCH | `/manifests/:id` | Update manifest status |

---

## 9. Branch Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/branches` | List branch locations |
| GET | `/branches/:id` | Branch detail |
| POST | `/branches` | Create branch (admin) |
| GET | `/branch-staff/counter` | Counter queue |
| POST | `/branch-staff/receive` | Receive package at branch |
| POST | `/branch-staff/register` | Register new package |
| POST | `/branch-staff/pickup` | Process customer pickup |
| GET | `/branch-staff/inventory` | Branch inventory |
| GET | `/branch-staff/shelf/:code` | Shelf lookup |
| POST | `/branch-staff/shelf/assign` | Assign package to shelf |
| POST | `/branch-staff/exceptions` | Report exception |

---

## 10. Merchant Platform Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/merchant-platform/analytics` | Shipping analytics |
| GET | `/merchant-platform/api-keys` | List API keys |
| POST | `/merchant-platform/api-keys` | Generate API key |
| DELETE | `/merchant-platform/api-keys/:id` | Revoke API key |
| GET | `/merchant-platform/webhooks` | List webhook endpoints |
| POST | `/merchant-platform/webhooks` | Register webhook |
| POST | `/merchant-api/orders` | External order creation (API key auth) |
| GET | `/merchant-api/orders/:ref` | External order status |

---

## 11. Dashboard Endpoints

Role-specific overview data for dashboard home pages:

| Method | Endpoint | Role |
|--------|----------|------|
| GET | `/dashboard/admin` | ADMIN, SUPER_ADMIN |
| GET | `/dashboard/customer` | CUSTOMER |
| GET | `/dashboard/driver` | DRIVER |
| GET | `/dashboard/merchant` | MERCHANT |
| GET | `/dashboard/warehouse` | WAREHOUSE_MANAGER, WAREHOUSE_STAFF |
| GET | `/dashboard/branch` | BRANCH_STAFF |
| GET | `/dashboard/support` | SUPPORT |
| GET | `/dashboard/finance` | FINANCE |
| GET | `/dashboard/operations/trucks` | ADMIN, OPERATIONS_MANAGER |

---

## 12. Support & Finance Endpoints

### 12.1 Support

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/support` | List tickets |
| POST | `/support` | Create ticket |
| GET | `/support/:id` | Ticket detail with messages |
| POST | `/support/:id/messages` | Add message to thread |
| PATCH | `/support/:id` | Update ticket status |

### 12.2 Finance

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/payments` | Payment ledger |
| GET | `/invoices` | Invoice list |
| PATCH | `/invoices/:id` | Update invoice status |
| GET | `/analytics/revenue` | Revenue analytics |
| GET | `/insurance-claims` | Insurance claim list |
| POST | `/insurance-claims` | File insurance claim |

---

## 13. Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/summary` | Platform summary statistics |
| GET | `/admin/audit-logs` | Audit log entries |
| GET | `/analytics` | Platform-wide analytics |
| GET | `/reports` | Generate operational reports |
| GET | `/search` | Cross-entity search |

---

## 14. Realtime (Socket.IO)

### 14.1 Connection

Clients connect to the same host as the API (port 4010 for Node). Authentication uses the JWT access token.

### 14.2 Events

| Event | Direction | Purpose |
|-------|-----------|---------|
| `driver:location` | Client → Server → Subscribers | Live GPS position |
| `order:status` | Server → Clients | Order status change |
| `order:tracking` | Server → Clients | Tracking timeline update |
| `driver:status` | Server → Clients | Online/offline/on-delivery |
| `notification:new` | Server → User | New notification |
| `chat:message` | Bidirectional | Support chat |
| `admin:metrics` | Server → Admin | Live dashboard stats |

Event constants are exported from `@delivery/types` as `SOCKET_EVENTS`.

---

## 15. Provider Abstractions

| Provider | Interface | Default (dev) | Production options |
|----------|-----------|---------------|-------------------|
| Storage | `StorageProvider` | Local filesystem | S3, MinIO |
| Payment | `PaymentProvider` | Fake (instant success) | Stripe, Chapa, Telebirr |
| Email | `EmailProvider` | Console log | SMTP, Mailpit |
| SMS | `SmsProvider` | Console log | Twilio |
| Push | `PushProvider` | Expo Push API | Expo Push API |
| Maps | OSRM + Nominatim | Public instances | Self-hosted |

---

## 16. Java API

### 16.1 Overview

The Java API mirrors Node functionality for production deployment. Schema changes from Phase 5 onward are applied via Flyway migrations (`V100+`).

### 16.2 Start

```bash
npm run dev:server:java
```

### 16.3 Phase Test Scripts

| Phase | Scope | Script |
|-------|-------|--------|
| P5 | Admin platform | `scripts/test-phase5-java.ps1` |
| P6 | Merchant platform | `scripts/test-phase6-java.ps1` |
| P7 | Cross-cutting | `scripts/test-phase7-java.ps1` |

Set `$env:API_BASE` to target either backend.

---

## 17. Testing

| Command | Scope |
|---------|-------|
| `scripts/test-phase{N}-node.ps1` | Node API integration (phases 2–7) |
| `scripts/test-phase{N}-java.ps1` | Java API integration (phases 2–7) |
| `mvn -f apps/guzo-api test` | Java unit tests |

---

*End of Chapter 3.*
