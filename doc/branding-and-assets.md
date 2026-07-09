# Chapter 11 — Branding & Assets

| Field | Value |
|-------|-------|
| **Chapter** | 11 of 12 |
| **Title** | Brand Identity and Asset Management |

---

## Table of Contents

1. [Brand Overview](#1-brand-overview)
2. [Source Assets](#2-source-assets)
3. [Mobile Branding Rules](#3-mobile-branding-rules)
4. [Web Branding](#4-web-branding)
5. [Marketing Branding](#5-marketing-branding)
6. [Sync Procedures](#6-sync-procedures)
7. [Expo Go QR Codes](#7-expo-go-qr-codes)
8. [Design System](#8-design-system)
9. [Asset Cleanup Policy](#9-asset-cleanup-policy)

---

## 1. Brand Overview

GUZO maintains a single source of truth for all brand assets in `assets/brand/`. Assets are distributed to applications via automated sync scripts — never copy files manually into individual app folders.

| Principle | Rule |
|-----------|------|
| Single source | Edit `assets/brand/` only |
| No duplicates | Per-app copies are generated, not hand-maintained |
| Consistent splash | Black background, full-screen cover mode |
| In-app mark | Transparent logo on gradient backgrounds |

---

## 2. Source Assets

| File | Dimensions | Use |
|------|------------|-----|
| `guzo-icon.png` | 1024×1024 | App icon (home screen, store listing) |
| `guzo-mark.png` | Transparent PNG | In-app headers, login screens |
| `splash.png` | Full logo on black | Native splash screen |

### 2.1 Directory

```
assets/
├── brand/
│   ├── guzo-icon.png
│   ├── guzo-mark.png
│   └── splash.png
└── mobile-qr/
    ├── customer-qr.png
    ├── driver-qr.png
    ├── merchant-qr.png
    └── branch-qr.png
```

---

## 3. Mobile Branding Rules

### 3.1 Screen-Type Mapping

| Context | Asset | Background | Component |
|---------|-------|------------|-----------|
| Native splash | `splash.png` | `#000000`, cover | Expo splash config |
| Login screen | `guzo-mark.png` | App gradient | `GuzoBrandLogo` |
| Loading state | `guzo-mark.png` | Black or gradient | `GuzoSplashLoading` |
| App icon | `guzo-icon.png` | Platform default | `app.config.ts` icon |

### 3.2 App Configuration

Each mobile `app.config.ts` must set:

```typescript
splash: {
  image: './assets/splash.png',
  resizeMode: 'cover',
  backgroundColor: '#000000',
}
```

Do not set `imageWidth` — it causes a small boxed logo on the splash screen.

### 3.3 Shared Components

| Component | Package | Purpose |
|-----------|---------|---------|
| `GuzoBrandLogo` | `@guzo/mobile-ui` | Sized transparent mark |
| `GuzoSplashLoading` | `@guzo/mobile-ui` | Full-screen splash with logo |

---

## 4. Web Branding

| Element | File |
|---------|------|
| Logo component | `apps/web/src/components/guzo-logo.tsx` |
| CSS variables | `apps/web/src/app/globals.css` |
| Tailwind tokens | `apps/web/tailwind.config.ts` |
| Favicon | `apps/web/public/` |

### 4.1 Web Design Language

| Element | Style |
|---------|-------|
| Cards | Glass morphism with backdrop blur |
| Backgrounds | Dark gradients with subtle mesh |
| Stat cards | Gradient borders with glow |
| Typography | Clean weight hierarchy |
| Icons | Lucide React icon set |
| Theme | Light and dark mode support |

---

## 5. Marketing Branding

| Element | File |
|---------|------|
| Logo | `apps/marketing/src/components/guzo-logo.tsx` |
| Content | `apps/marketing/src/constants/marketing-content.ts` |
| 3D hero | Three.js city scene (brand colors in lighting) |
| iPhone mockup | Titanium shell with brand accent highlights |

---

## 6. Sync Procedures

### 6.1 Brand Asset Sync

```bash
npm run mobile:brand
```

Copies `assets/brand/*` to each mobile app's `assets/` directory via `scripts/sync-mobile-brand.ps1`.

### 6.2 Splash Regeneration

```bash
npm run mobile:splash
```

Regenerates per-app splash images from the source `splash.png` via `scripts/generate-mobile-splash.ps1`.

### 6.3 When to Sync

| Trigger | Action |
|---------|--------|
| Logo updated in `assets/brand/` | Run `mobile:brand` + `mobile:splash` |
| New mobile app added | Add to sync script targets |
| Splash looks wrong on device | Run `mobile:splash`, clear Expo cache |

---

## 7. Expo Go QR Codes

Pre-generated QR images for quick device testing:

| File | App | Port |
|------|-----|------|
| `customer-qr.png` | Customer | 8081 |
| `driver-qr.png` | Driver | 8082 |
| `merchant-qr.png` | Merchant | 8083 |
| `branch-qr.png` | Branch | 8084 |

Regenerate after IP or port changes:

```bash
npm run mobile:qr
```

---

## 8. Design System

### 8.1 Web Components

| Component | File | Purpose |
|-----------|------|---------|
| Futuristic primitives | `futuristic-primitives.tsx` | Glass cards, gradient panels |
| Stat card | `stat-card.tsx` | KPI display |
| Button | `ui/button.tsx` | Primary, secondary, ghost variants |
| Badge | `ui/badge.tsx` | Status indicators |
| Card | `ui/card.tsx` | Content containers |

### 8.2 Mobile Components

| Component | Package | Purpose |
|-----------|---------|---------|
| GlassCard | mobile-ui | Translucent card container |
| GradientButton | mobile-ui | Primary action button |
| StatCard | mobile-ui | Metric display |
| FloatingTabBar | mobile-ui | Bottom tab navigation |
| LiveTrackingMap | mobile-ui | Map with route overlay |
| SignatureCapture | mobile-ui | POD signature pad |
| TrackingScanner | mobile-ui | Barcode scanner overlay |

### 8.3 Shared Tailwind Preset

`packages/ui/tailwind-preset.cjs` provides shared color tokens and utilities consumed by web workspaces.

---

## 9. Asset Cleanup Policy

The following were removed during project cleanup and must not be reintroduced:

| Removed | Reason |
|---------|--------|
| Per-app `splash-icon.png` | Replaced by synced `splash.png` |
| Per-app `logo.png` duplicates | Replaced by `guzo-mark.png` sync |
| Per-app `guzo-icon.png` copies | Replaced by brand sync |
| `testimonials.tsx` | Removed from marketing home |
| `partners.tsx` | Removed from marketing home |
| `README.keep.md` | Obsolete duplicate readme |

---

*End of Chapter 11.*
