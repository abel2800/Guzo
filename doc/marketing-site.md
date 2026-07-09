# Chapter 5 — Marketing Site

| Field | Value |
|-------|-------|
| **Chapter** | 5 of 12 |
| **Title** | Marketing Website Reference |
| **URL** | http://localhost:3001 |
| **Framework** | Next.js, Tailwind CSS, Three.js |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Site Map](#2-site-map)
3. [Home Page Sections](#3-home-page-sections)
4. [Key Components](#4-key-components)
5. [Content Management](#5-content-management)
6. [Design System](#6-design-system)
7. [Development](#7-development)

---

## 1. Overview

The marketing site (`apps/marketing`) is the public-facing web presence for GUZO. It requires no authentication and serves product information, platform showcase, public tracking, and app download links.

| Attribute | Value |
|-----------|-------|
| Port | 3001 |
| Content source | `src/constants/marketing-content.ts` |
| 3D hero | `src/components/home/hero.tsx` + `HeroCanvas` |
| Styling | Tailwind with custom brand tokens |

---

## 2. Site Map

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Full marketing landing page |
| `/about` | About | Company information |
| `/services` | Services | Delivery service tiers |
| `/pricing` | Pricing | Transparent pricing plans |
| `/tracking` | Tracking | Public shipment lookup |
| `/drivers` | Drivers | Driver recruitment and earnings |
| `/merchants` | Merchants | Business onboarding |
| `/download` | Download | App download hub |
| `/contact` | Contact | Contact form |
| `/faq` | FAQ | Frequently asked questions |
| `/careers` | Careers | Job listings |
| `/press` | Press | Press resources |
| `/investors` | Investors | Investor information |
| `/privacy` | Privacy | Privacy policy |
| `/terms` | Terms | Terms of service |

---

## 3. Home Page Sections

The home page (`src/app/page.tsx`) renders sections in order. All copy is centralized in `marketing-content.ts`.

| Order | Section | Component | Description |
|-------|---------|-----------|-------------|
| 1 | Hero | `hero.tsx` | 3D city scene with delivery demo card |
| 2 | Stats | `stats-bar.tsx` | Key platform metrics bar |
| 3 | What is GUZO | `what-is-guzo.tsx` | Product positioning overview |
| 4 | Why choose GUZO | `why-choose-guzo.tsx` | Value propositions |
| 5 | Live map | `live-map.tsx` | Animated delivery route visualization |
| 6 | Platform showcase | `platform-showcase.tsx` | 3D iPhone mockup with role tabs |
| 7 | Tracking timeline | `tracking-timeline.tsx` | Shipment lifecycle visual |
| 8 | Technology | `technology.tsx` | Technical capabilities |
| 9 | Built for everyone | `built-for-everyone.tsx` | Audience segment cards |
| 10 | Business & security | `business-and-security.tsx` | Enterprise trust signals |
| 11 | Vision | `vision-section.tsx` | Company vision statement |
| 12 | FAQ | `faq.tsx` | Accordion FAQ section |
| 13 | Download CTA | `download-cta.tsx` | App store and Expo links |
| 14 | Final CTA | `final-cta.tsx` | Registration call to action |

---

## 4. Key Components

### 4.1 HeroCanvas (3D City)

| Attribute | Value |
|-----------|-------|
| File | `src/components/home/city-scene.tsx` |
| Technology | Three.js via React Three Fiber |
| Purpose | Interactive 3D city backdrop in hero section |
| Preserved | Original design element, retained in redesign |

### 4.2 Delivery Demo Card

| Attribute | Value |
|-----------|-------|
| File | `src/components/home/delivery-demo-card.tsx` |
| Purpose | Interactive delivery status animation in hero |
| Features | Step-through delivery stages, animated progress |

### 4.3 iPhone Mockup

| Attribute | Value |
|-----------|-------|
| File | `src/components/home/iphone-mockup.tsx` |
| Purpose | 3D iPhone frame for platform showcase |
| Features | Dynamic Island, titanium shell, tilt animation, float effect |
| Tabs | Customer, Courier, Business, Warehouse app previews |

### 4.4 Download Hub

| Attribute | Value |
|-----------|-------|
| File | `src/components/download/download-hub.tsx` |
| Purpose | App picker with platform toggle (iOS/Android) |
| Data | `src/data/app-downloads.ts` |

### 4.5 GUZO Logo

| File | `src/components/guzo-logo.tsx` |
| Variants | Full logo, mark only, with/without text |

---

## 5. Content Management

All marketing copy is defined in `src/constants/marketing-content.ts`:

| Content Block | Keys |
|---------------|------|
| Hero | Headline, subheadline, CTA buttons |
| Stats | Metric values and labels |
| Features | Feature cards with icons |
| FAQ | Question/answer pairs |
| Platform tabs | Per-role app screenshots and descriptions |
| CTA | Call-to-action text and links |

To update marketing copy, edit this file and restart the dev server.

---

## 6. Design System

| Element | Specification |
|---------|---------------|
| Layout | Premium Cainiao/Stripe-inspired |
| Colors | Dark gradients with brand accent |
| Typography | Clean sans-serif hierarchy |
| Animations | Framer Motion scroll reveals |
| 3D | WebGL hero (requires capable browser) |
| Responsive | Mobile-first breakpoints |
| Cards | Glass morphism with subtle borders |

---

## 7. Development

```bash
npm run dev:marketing
```

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | http://localhost:4000/api/v1 | Public tracking API |
| `NEXT_PUBLIC_WEB_APP_URL` | http://localhost:3000 | Login/register links |

The marketing site can proxy API requests for public tracking via `next.config.mjs`.

---

*End of Chapter 5.*
