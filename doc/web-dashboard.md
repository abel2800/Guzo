# Chapter 4 — Web Dashboard

| Field | Value |
|-------|-------|
| **Chapter** | 4 of 12 |
| **Title** | Web Dashboard Reference |
| **URL** | http://localhost:3000 |
| **Framework** | Next.js 15, React 19, Tailwind CSS |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Routing Model](#2-routing-model)
3. [Authentication Flow](#3-authentication-flow)
4. [Layout & Navigation](#4-layout--navigation)
5. [Role Workspaces](#5-role-workspaces)
6. [Section Registry](#6-section-registry)
7. [Shared Components](#7-shared-components)
8. [Theming](#8-theming)
9. [API Integration](#9-api-integration)
10. [Development](#10-development)

---

## 1. Overview

The web dashboard (`apps/web`) is a role-aware administrative and customer console. Each authenticated user is routed to a workspace matching their primary role, with a tailored sidebar, overview page, and feature sections.

| Attribute | Value |
|-----------|-------|
| Entry point | `/login` |
| Dashboard pattern | `/dashboard/[role]/[section]` |
| Role config | `apps/web/src/lib/roles.ts` |
| Section mapping | `apps/web/src/components/dashboard/section-registry.tsx` |
| API client | `apps/web/src/lib/api.ts` |

---

## 2. Routing Model

### 2.1 Public Routes

| Route | Page |
|-------|------|
| `/` | Landing redirect |
| `/login` | Email/password login |
| `/register` | Account registration with phone OTP |
| `/forgot-password` | Email or phone OTP password reset |

### 2.2 Protected Routes

| Route | Page |
|-------|------|
| `/dashboard` | Redirect to primary role dashboard |
| `/dashboard/[role]` | Role overview (stats, quick actions) |
| `/dashboard/[role]/[section]` | Feature section component |

### 2.3 Role Slug Mapping

| API Role | URL Slug |
|----------|----------|
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

---

## 3. Authentication Flow

### 3.1 Login

1. User submits credentials at `/login`.
2. Client calls `POST /auth/login` and stores access token.
3. Client calls `GET /auth/me` to retrieve roles and permissions.
4. `primarySlugForRoles()` selects the highest-priority dashboard.
5. User is redirected to `/dashboard/[role]`.
6. On HTTP 401, client calls `POST /auth/refresh` and retries.
7. Logout calls `POST /auth/logout` and clears local storage.

### 3.2 Registration (OTP)

1. User enters details at `/register` including phone number.
2. Client calls `POST /otp/send` and `POST /otp/verify`.
3. Client calls `POST /auth/register` after OTP is verified.
4. Driver, merchant, and branch signups may show pending-approval state until an admin activates the account.

### 3.3 Forgot Password

1. User submits email or phone at `/forgot-password`.
2. Phone flow uses OTP via `POST /auth/forgot-password` and `POST /auth/reset-password`.
3. Email flow uses the legacy reset-token path.

---

## 4. Layout & Navigation

### 4.1 Dashboard Layout

The layout (`apps/web/src/app/dashboard/[role]/layout.tsx`) provides:

| Element | Component | Description |
|---------|-----------|-------------|
| Sidebar | `sidebar-nav.tsx` | Role-specific navigation links |
| Top bar | Layout header | Breadcrumb, search, actions |
| Command menu | `command-menu.tsx` | `Cmd+K` quick navigation |
| User menu | `user-menu.tsx` | Profile, settings, logout |
| Notifications | `notification-center.tsx` | In-app alert inbox with deep links to orders/sections |
| Theme toggle | `theme-toggle.tsx` | Light/dark mode switch |

### 4.2 Sidebar Navigation

Navigation items are defined per role in `ROLE_CONFIG` (`roles.ts`). Each item maps a title, relative href, and Lucide icon to a dashboard section.

### 4.3 Command Menu

Press `Cmd+K` (or `Ctrl+K`) to open the command palette. Supports fuzzy search across all sections available to the current role.

### 4.4 Interactive Overview

Overview stat cards (`stat-card.tsx`) accept an optional `href` so KPI tiles navigate to the relevant filtered section (orders, jobs, inventory, etc.). Dashboard home pages wire stats to sidebar sections for each role.

---

## 5. Role Workspaces

### 5.1 Super Admin

| Section | Component | Function |
|---------|-----------|----------|
| Overview | Dashboard home | Platform-wide statistics |
| Analytics | `admin-analytics.tsx` | Charts and KPIs |
| Users | `users-table.tsx` | User administration |
| Roles | `admin-roles.tsx` | Role management |
| Permissions | `admin-permissions.tsx` | Permission assignment |
| Drivers | `drivers-table.tsx` | Driver approval and management |
| Merchants | `admin-merchants.tsx` | Merchant accounts |
| Customers | `admin-customers.tsx` | Customer accounts |
| Branches | `admin-branches.tsx` | Branch network |
| Warehouses | `admin-warehouses.tsx` | Warehouse facilities |
| Orders | `orders-table.tsx` | All platform orders |
| Tracking | `ops-tracking.tsx` | Live shipment tracking |
| Control tower | `admin-control-tower.tsx` | Operations command center |
| Exceptions | `admin-exception-center.tsx` | Exception handling |
| Payments | `admin-payments.tsx` | Payment administration |
| Pricing | `admin-pricing.tsx` | Pricing rule configuration |
| Coupons | `admin-coupons.tsx` | Discount code management |
| Audit logs | `admin-audit-logs.tsx` | Security audit trail |
| Activity logs | `admin-activity-logs.tsx` | Operational activity |
| Settings | `profile-settings.tsx` | Profile configuration |

### 5.2 Admin

Subset of super-admin capabilities: users, orders, drivers, merchants, customers, branches, warehouses, tracking, control tower, exceptions, payments, support, reports, analytics, activity logs.

### 5.3 Operations Manager

| Section | Function |
|---------|----------|
| Orders | Platform order management |
| Drivers | Driver oversight |
| Tracking | Live tracking map |
| Control tower | Dispatch command center |
| Exceptions | Exception resolution |
| Live trucks | Real-time truck map (`ops-truck-map.tsx`) |
| Warehouses | Warehouse overview |
| Branches | Branch network status |
| Vehicles | Fleet management (`admin-vehicles.tsx`) |
| Reports | Operational reports |
| Analytics | Platform metrics |

### 5.4 Customer

| Section | Component | Function |
|---------|-----------|----------|
| Book | `book-shipment.tsx` | Multi-step shipment wizard |
| Track | `track-shipment.tsx` | Live tracking; driver photo, vehicle, plate when assigned |
| Orders | `my-orders.tsx` | Order history with status bucket filters; pickup QR on detail |
| Addresses | `addresses.tsx` | Saved address management |
| Wallet | `wallet.tsx` | Wallet balance and top-up |
| Invoices | `invoices.tsx` | Billing history |
| Reviews | `customer-ratings.tsx` | Rate completed deliveries |
| Loyalty | `customer-loyalty.tsx` | Loyalty points balance |
| Insurance | `customer-insurance.tsx` | File insurance claims |
| Support | `customer-support.tsx` | Open support tickets |

### 5.5 Driver

| Section | Component | Function |
|---------|-----------|----------|
| Available | `available-jobs.tsx` | Browse open jobs (`CONFIRMED`, `AT_BRANCH`) |
| Accepted | `my-deliveries.tsx` | Slide actions, pickup scan dialog, call receiver |
| Navigation | `driver-navigation.tsx` | Turn-by-turn directions |
| Manifests | `driver-manifests.tsx` | Transport manifest management |
| Vehicle | `driver-vehicle.tsx` | Vehicle type, plate, photo, logs |
| POD | `pod-history.tsx` | Proof of delivery history |
| Earnings | `driver-earnings.tsx` | Earnings summary |
| History | `driver-history.tsx` | Past delivery records |

Includes Leaflet + OpenStreetMap integration for live tracking.

### 5.6 Merchant

| Section | Component | Function |
|---------|-----------|----------|
| Create | `book-shipment.tsx` | Single order creation |
| Orders | `merchant-orders.tsx` | Order management |
| Bulk upload | `bulk-upload.tsx` | CSV batch import |
| Customers | `merchant-customers.tsx` | Customer directory |
| Invoices | `merchant-invoices.tsx` | Invoice list |
| Analytics | `merchant-analytics.tsx` | Shipping metrics |
| API keys | `merchant-api-keys.tsx` | Integration key management |

### 5.7 Warehouse Manager

| Section | Function |
|---------|----------|
| Incoming | Package receiving (`warehouse/receiving.tsx`) |
| Sorting | Sort and route (`warehouse-sorting.tsx`) |
| Manifests | Outbound manifests (`warehouse-manifests.tsx`) |
| Inventory | Stock management (`inventory.tsx`) |
| Aging | Aging inventory alerts (`warehouse-aging.tsx`) |
| Transfer | Inter-warehouse transfers (`warehouse-transfer.tsx`) |
| Live trucks | Real-time truck map |
| Employees | Staff management (`warehouse-employees.tsx`) |
| Reports | Warehouse reports (`warehouse-reports.tsx`) |

### 5.8 Warehouse Staff

| Section | Function |
|---------|----------|
| Incoming | Receive and scan packages |
| Sorting | Sort packages to routes |
| Manifests | View and manage manifests |
| Dispatch | Outbound dispatch queue |
| Inventory | Current stock levels |
| Aging | Packages exceeding SLA |
| Transfer | Initiate transfers |

### 5.9 Branch Staff

| Section | Component | Function |
|---------|-----------|----------|
| Counter | `branch-counter.tsx` | Customer pickup counter |
| Register | `branch-register.tsx` | New package registration |
| Shelf | `branch-shelf.tsx` | Shelf assignment and lookup |
| Inventory | `branch-inventory.tsx` | Branch stock list |
| Exceptions | `branch-exceptions.tsx` | Damaged/missing/hold packages |

### 5.10 Support

| Section | Component | Function |
|---------|-----------|----------|
| Tickets | `support-tickets.tsx` | Ticket queue |
| Orders | `support-orders.tsx` | Order lookup for customers |
| Refunds | `support-refunds.tsx` | Refund request processing |
| Knowledge base | `support-kb.tsx` | KB article management |
| Notifications | `notification-center.tsx` | Alert inbox |

### 5.11 Finance

| Section | Component | Function |
|---------|-----------|----------|
| Payments | `finance-payments.tsx` | Transaction ledger |
| Invoices | `finance-invoices.tsx` | Invoice management |
| Refunds | `finance-refunds.tsx` | Refund reconciliation |
| Revenue | `finance-revenue.tsx` | Revenue analytics |
| Taxes | `finance-taxes.tsx` | Tax reporting |

---

## 6. Section Registry

The `SECTION_REGISTRY` object maps `"${role}/${section}"` keys to React components. Sections not registered display a "coming soon" placeholder.

All roles include a `settings` section mapped to `profile-settings.tsx` for name, phone, and avatar management.

---

## 7. Shared Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Stat cards | `stat-card.tsx` | KPI display with optional `href` navigation |
| Glass primitives | `futuristic-primitives.tsx` | Glass morphism UI elements |
| GUZO logo | `guzo-logo.tsx` | Brand mark |
| Notification routes | `lib/notification-routes.ts` | Deep-link targets from alerts |
| Barcode scanner | `warehouse/barcode-scanner.tsx` | Camera-based scanning |
| Map | `components/map/` | Leaflet map wrapper |
| Proof of delivery | `driver/proof-of-delivery.tsx` | Photo + signature capture |
| Pickup scan | `driver/pickup-scan-dialog.tsx` | Scan barcode/QR/PIN at pickup |
| Pickup proof | `driver/pickup-proof-dialog.tsx` | Pickup confirmation dialog |
| Branch handoff | `driver/branch-handoff-dialog.tsx` | Branch delivery handoff |
| Profile settings | `shared/profile-settings.tsx` | Name, phone, avatar management |

---

## 8. Theming

| Feature | Implementation |
|---------|----------------|
| Light/dark mode | `theme-toggle.tsx` + CSS variables in `globals.css` |
| Color system | Tailwind config with brand tokens |
| Glass design | Gradient backgrounds, backdrop blur, border glow |
| Typography | System font stack with weight hierarchy |
| Responsive | Mobile sidebar via sheet component |

---

## 9. API Integration

| Library | File | Purpose |
|---------|------|---------|
| HTTP client | `lib/api.ts` | Axios instance with auth interceptors |
| Auth store | `lib/auth-store.ts` | Zustand auth state |
| Socket | `lib/socket.ts` | Socket.IO client connection |
| Order socket | `lib/use-order-socket.ts` | Order room subscription hook |
| Domain APIs | `lib/orders.ts`, `lib/admin.ts`, etc. | Typed API functions |

Environment variable: `NEXT_PUBLIC_API_URL=http://localhost:4010/api/v1`

---

## 10. Development

```bash
npm run dev:web
```

| Task | Command |
|------|---------|
| Lint | `npm run lint` (from root) |
| Type check | Included in workspace build |
| Add new section | Register in `section-registry.tsx` + add nav item in `roles.ts` |

---

*End of Chapter 4.*
