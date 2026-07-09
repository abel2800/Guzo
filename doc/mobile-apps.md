# Chapter 6 — Mobile Applications

| Field | Value |
|-------|-------|
| **Chapter** | 6 of 12 |
| **Title** | Mobile Application Reference |
| **Platform** | Expo SDK 54, React Native |
| **Apps** | 4 (Customer, Driver, Merchant, Branch) |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Shared Architecture](#2-shared-architecture)
3. [Customer Application](#3-customer-application)
4. [Driver Application](#4-driver-application)
5. [Merchant Application](#5-merchant-application)
6. [Branch Application](#6-branch-application)
7. [Authentication](#7-authentication)
8. [Offline Support](#8-offline-support)
9. [Branding & Splash](#9-branding--splash)
10. [Running & Testing](#10-running--testing)
11. [Production Builds](#11-production-builds)

---

## 1. Overview

| Application | Path | Expo Port | Target Role |
|-------------|------|-----------|-------------|
| Customer | `apps/mobile-customer` | 8081 | CUSTOMER |
| Driver | `apps/mobile-driver` | 8082 | DRIVER |
| Merchant | `apps/mobile-merchant` | 8083 | MERCHANT |
| Branch | `apps/mobile-branch` | 8084 | BRANCH_STAFF |

Each app is an independent Expo project sharing common libraries. Navigation uses Expo Router with file-based routing.

---

## 2. Shared Architecture

### 2.1 Packages

| Package | Contents |
|---------|----------|
| `@guzo/mobile-shared` | API client, auth context, Socket.IO, offline queue, secure storage, hooks |
| `@guzo/mobile-ui` | GlassCard, GradientButton, StatCard, maps, splash, brand logo, signature capture, barcode scanner |

### 2.2 Directory Structure (per app)

```
apps/mobile-{role}/
├── app/                  Expo Router screens
│   ├── _layout.tsx       Root layout
│   ├── index.tsx         Entry redirect
│   ├── login.tsx         Login screen
│   ├── register.tsx      Registration
│   └── (tabs)/           Tab navigation screens
├── lib/                  App-specific config and auth
├── assets/               Synced brand images
├── app.config.ts         Expo configuration
└── eas.json              EAS Build profiles
```

### 2.3 Configuration

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_API_URL` | API base URL (set by dev launcher) |

---

## 3. Customer Application

### 3.1 Screens

| Screen | Route | Function |
|--------|-------|----------|
| Login | `/login` | Email/password + biometric unlock |
| Register | `/register` | Account creation |
| Home | `/(tabs)/home` | Active orders, quick actions |
| Book | `/(tabs)/book` | 4-step delivery wizard |
| Orders | `/(tabs)/orders` | Order list |
| Order detail | `/order/[id]` | Single order view |
| Track | `/(tabs)/track` | Tracking search |
| Track detail | `/track/[ref]` | Live map tracking |
| Alerts | `/(tabs)/alerts` | Notification timeline |
| Profile | `/(tabs)/profile` | Account settings |

### 3.2 Features

- Multi-step booking wizard (pickup, dropoff, package details, confirmation)
- Real-time order tracking with map
- Push notification support
- Socket.IO live status updates
- Biometric login (Face ID / fingerprint)
- Offline mutation queue

---

## 4. Driver Application

### 4.1 Screens

| Screen | Route | Function |
|--------|-------|----------|
| Login | `/login` | Role-validated (DRIVER only) |
| Home | `/(tabs)/home` | Dashboard overview |
| Jobs | `/(tabs)/jobs` | Available delivery jobs |
| Active | `/(tabs)/active` | In-progress deliveries |
| Delivery | `/delivery/[id]` | Active delivery detail |
| POD | `/(tabs)/pod` | Proof of delivery capture |
| Profile | `/(tabs)/profile` | Earnings, settings |

### 4.2 Features

- Browse and accept available jobs
- GPS location ping every 15 seconds during active delivery
- Live map with route display
- Proof of delivery: photo capture + digital signature
- Offline GPS queue (syncs on reconnect)
- Manifest scan/depart/arrive/unload workflow
- Vehicle log management
- Branch handoff support

---

## 5. Merchant Application

### 5.1 Screens

| Screen | Route | Function |
|--------|-------|----------|
| Login | `/login` | Role-validated (MERCHANT only) |
| Home | `/(tabs)/home` | Dashboard stats |
| Create | `/(tabs)/create` | Single order form |
| Orders | `/(tabs)/orders` | Order management |
| Bulk | `/(tabs)/bulk` | CSV batch upload |
| Invoices | `/invoices` | Invoice list |
| API keys | `/api-keys` | Integration keys |
| Analytics | `/analytics` | Shipping metrics |
| Customers | `/customers` | Customer directory |
| Profile | `/(tabs)/profile` | Business settings |

### 5.2 Features

- Single and bulk order creation
- Order status tracking
- Analytics dashboard (volume, revenue, SLA)
- Invoice viewing
- API key management for external integrations
- Customer directory

---

## 6. Branch Application

### 6.1 Screens

| Screen | Route | Function |
|--------|-------|----------|
| Login | `/login` | Role-validated (BRANCH_STAFF only) |
| Home | `/(tabs)/home` | Branch overview |
| Receive | `/(tabs)/receive` | Scan and receive packages |
| Pickup | `/(tabs)/pickup` | Customer pickup counter |
| Inventory | `/inventory` | Branch stock list |
| Shelf | `/shelf` | Shelf assignment and lookup |
| Exceptions | `/exceptions` | Exception handling |
| Profile | `/(tabs)/profile` | Account settings |

### 6.2 Features

- Barcode scanning for package receive
- Customer pickup with verification code
- Shelf management (assign, lookup by code)
- Exception reporting (damaged, missing, hold)
- Branch inventory view
- Label printing support (ESC/POS)
- BLE scale integration for weight capture

### 6.3 Local Testing

Use accounts created by `npm run db:seed`. Set `SEED_DEMO_PASSWORD` in `apps/server/.env` before seeding.

---

## 7. Authentication

### 7.1 Flow

1. User enters email and password.
2. App calls `POST /auth/login`.
3. Tokens stored in Expo SecureStore.
4. App validates user role matches app requirement.
5. On app resume, biometric prompt offers quick unlock.
6. Token auto-refresh on 401 responses.

### 7.2 Role Validation

Each app rejects login if the user's role does not match:

| App | Required Role |
|-----|---------------|
| mobile-customer | CUSTOMER |
| mobile-driver | DRIVER |
| mobile-merchant | MERCHANT |
| mobile-branch | BRANCH_STAFF |

---

## 8. Offline Support

| Feature | Implementation |
|---------|----------------|
| Mutation queue | `packages/mobile-shared/src/offline.ts` |
| GPS queue | Driver app `lib/offline.ts` |
| Scan queue | `packages/mobile-shared/src/scan-queue.ts` |
| Retry | Automatic on network reconnect |
| UI indicator | `offline-banner.tsx` component |

Queued operations include order actions, GPS pings, and barcode scans.

---

## 9. Branding & Splash

| Screen Type | Asset | Background |
|-------------|-------|------------|
| Native splash | `assets/splash.png` | `#000000`, cover mode |
| Login / in-app | `assets/guzo-mark.png` | App gradient |
| App icon | `assets/guzo-icon.png` | Platform default |

Sync commands:

```bash
npm run mobile:brand     # Copy from assets/brand/
npm run mobile:splash    # Regenerate splash screens
npm run mobile:qr        # Regenerate Expo Go QR images
```

---

## 10. Running & Testing

### 10.1 All Apps

```bash
npm run dev
```

### 10.2 Single App

```bash
npm run dev:mobile-customer
npm run dev:mobile-driver
npm run dev:mobile-merchant
npm run dev:mobile-branch
```

### 10.3 Physical Device

1. Install Expo Go on your phone.
2. Connect phone and PC to the same Wi-Fi network.
3. Scan the QR code from the terminal or `assets/mobile-qr/`.
4. Ensure `EXPO_PUBLIC_API_URL` points to your LAN IP (set automatically by `npm run dev`).

Expo starts in `--offline` mode to prevent network fetch errors during development.

---

## 11. Production Builds

### 11.1 EAS Build Commands

| Command | Platform |
|---------|----------|
| `npm run build:mobile:android` | Android APK/AAB |
| `npm run build:mobile:ios` | iOS IPA |
| `npm run build:mobile:all` | Both platforms |
| `npm run eas:customer:preview` | Customer preview build |
| `npm run eas:driver:preview` | Driver preview build |
| `npm run eas:merchant:preview` | Merchant preview build |

### 11.2 Prerequisites

- `EXPO_TOKEN` environment variable for EAS authentication
- Run `npm run eas:setup` for initial configuration
- Build profiles defined in each app's `eas.json`

---

*End of Chapter 6.*
