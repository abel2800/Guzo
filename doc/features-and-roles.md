# Chapter 7 — Features & Roles

| Field | Value |
|-------|-------|
| **Chapter** | 7 of 12 |
| **Title** | Platform Features and Role Capabilities |

---

## Table of Contents

1. [Feature Overview](#1-feature-overview)
2. [Order Lifecycle](#2-order-lifecycle)
3. [Role Capability Matrix](#3-role-capability-matrix)
4. [Customer Features](#4-customer-features)
5. [Driver Features](#5-driver-features)
6. [Merchant Features](#6-merchant-features)
7. [Warehouse Features](#7-warehouse-features)
8. [Branch Features](#8-branch-features)
9. [Operations Features](#9-operations-features)
10. [Support Features](#10-support-features)
11. [Finance Features](#11-finance-features)
12. [Admin Features](#12-admin-features)
13. [Cross-Cutting Features](#13-cross-cutting-features)

---

## 1. Feature Overview

| Category | Features |
|----------|----------|
| Booking | Single order, bulk upload, price quotes, address book |
| Dispatch | Driver assignment, job acceptance, manifest management |
| Tracking | Real-time GPS, status timeline, public tracking |
| Warehouse | Receive, sort, dispatch, aging, transfer |
| Branch | Counter, receive, shelf, pickup, exceptions |
| Payments | Wallets, invoices, coupons, refunds |
| Support | Tickets, knowledge base, refund processing |
| Engagement | Reviews, loyalty points, insurance claims |
| Analytics | Admin, merchant, finance dashboards |
| Integration | Merchant API keys, webhooks, external API |

---

## 2. Order Lifecycle

### 2.1 State Machine

```
DRAFT
  → PENDING_PAYMENT
  → CONFIRMED
  → ASSIGNED          (driver accepts)
  → PICKED_UP
  → IN_TRANSIT
  → AT_WAREHOUSE      (optional hub routing)
  → AT_BRANCH         (branch network routing)
  → AT_DESTINATION_BRANCH
  → OUT_FOR_DELIVERY
  → DELIVERED         (terminal: success)

CONFIRMED → CANCELLED  (terminal: cancelled)
OUT_FOR_DELIVERY → FAILED → RETURNED
```

### 2.2 Visibility

| Stakeholder | Visibility |
|-------------|------------|
| Customer | Full timeline via web, mobile, public tracking |
| Driver | Active delivery status and navigation |
| Merchant | Order status and analytics |
| Operations | All orders, live map, control tower |
| Branch | Packages at branch, pickup queue |
| Warehouse | Packages in facility, aging alerts |

Status transitions are enforced server-side. Each change triggers a Socket.IO broadcast to subscribed clients.

### 2.3 Pickup Methods

| Method | Flow |
|--------|------|
| COMPANY_PICKUP | Driver collects from sender address |
| DROP_AT_BRANCH | Sender drops package at branch office |
| BRANCH_PICKUP | Receiver collects from destination branch |

---

## 3. Role Capability Matrix

| Capability | Customer | Driver | Merchant | Branch | Warehouse | Ops | Admin | Finance | Support |
|------------|:--------:|:------:|:--------:|:------:|:---------:|:---:|:-----:|:-------:|:-------:|
| Book shipment | Yes | — | Yes | — | — | — | — | — | — |
| Track shipment | Yes | Yes | Yes | Yes | Yes | Yes | Yes | — | Yes |
| Accept delivery | — | Yes | — | — | — | — | — | — | — |
| Upload POD | — | Yes | — | — | — | — | — | — | — |
| Bulk upload | — | — | Yes | — | — | — | — | — | — |
| API keys | — | — | Yes | — | — | — | — | — | — |
| Receive packages | — | — | — | Yes | Yes | — | — | — | — |
| Counter pickup | — | — | — | Yes | — | — | — | — | — |
| Sort/dispatch | — | — | — | — | Yes | Yes | — | — | — |
| Manage users | — | — | — | — | — | — | Yes | — | — |
| Process payments | — | — | — | — | — | — | Yes | Yes | — |
| Handle tickets | Yes | — | — | — | — | — | Yes | — | Yes |
| View analytics | — | — | Yes | — | Yes | Yes | Yes | Yes | — |

---

## 4. Customer Features

| Feature | Web | Mobile | API |
|---------|-----|--------|-----|
| Book shipment | Yes | Yes | POST /orders |
| Track by reference | Yes | Yes | GET /orders/track/:ref |
| Order history | Yes | Yes | GET /orders |
| Saved addresses | Yes | — | /addresses |
| Wallet | Yes | — | /payments |
| Invoices | Yes | — | /invoices |
| Reviews | Yes | — | /reviews |
| Loyalty points | Yes | — | /loyalty |
| Insurance claims | Yes | — | /insurance-claims |
| Support tickets | Yes | — | /support |

---

## 5. Driver Features

| Feature | Web | Mobile | API |
|---------|-----|--------|-----|
| Browse jobs | Yes | Yes | GET /orders (available) |
| Accept job | Yes | Yes | POST /orders/:id/accept |
| GPS tracking | Yes | Yes | Socket.IO driver:location |
| Navigation | Yes | Yes | /drivers/me/route |
| Proof of delivery | Yes | Yes | POST /orders/:id/pod |
| Pickup proof | Yes | Yes | POST /orders/:id/pickup-proof |
| Manifests | Yes | Yes | /drivers/me/manifests |
| Vehicle logs | Yes | — | /drivers/me/vehicle/logs |
| Earnings | Yes | — | /drivers/me/earnings |
| Offline GPS | — | Yes | Queued locally |

---

## 6. Merchant Features

| Feature | Web | Mobile | API |
|---------|-----|--------|-----|
| Create order | Yes | Yes | POST /orders |
| Bulk upload | Yes | Yes | POST /orders/bulk |
| Order management | Yes | Yes | GET /orders |
| Analytics | Yes | Yes | /merchant-platform/analytics |
| Invoices | Yes | Yes | /invoices |
| API keys | Yes | Yes | /merchant-platform/api-keys |
| Webhooks | Yes | — | /merchant-platform/webhooks |
| Customer directory | Yes | Yes | /customers |
| External API | — | — | /merchant-api/orders |

---

## 7. Warehouse Features

| Feature | Web | API |
|---------|-----|-----|
| Receive packages | Yes | POST /warehouses/:id/receive |
| Sort packages | Yes | POST /warehouses/:id/sort |
| Dispatch | Yes | POST /warehouses/:id/dispatch |
| Inventory view | Yes | GET /warehouses/:id/inventory |
| Aging report | Yes | GET /warehouses/:id/aging |
| Inter-warehouse transfer | Yes | POST /warehouses/:id/transfer |
| Manifest management | Yes | /manifests |
| Employee management | Yes (manager) | — |
| Live truck map | Yes (manager) | /dashboard/operations/trucks |

---

## 8. Branch Features

| Feature | Web | Mobile | API |
|---------|-----|--------|-----|
| Counter operations | Yes | Yes | /branch-staff/counter |
| Package registration | Yes | Yes | /branch-staff/register |
| Receive packages | Yes | Yes | /branch-staff/receive |
| Customer pickup | Yes | Yes | /branch-staff/pickup |
| Shelf management | Yes | Yes | /branch-staff/shelf |
| Branch inventory | Yes | Yes | /branch-staff/inventory |
| Exception handling | Yes | Yes | /branch-staff/exceptions |
| Label printing | — | Yes | ESC/POS via BLE |

---

## 9. Operations Features

| Feature | Description |
|---------|-------------|
| Order management | Full platform order table |
| Driver management | Approval, assignment, tracking |
| Live tracking | Real-time map of all active deliveries |
| Control tower | Centralized dispatch command center |
| Exception center | Handle failed, delayed, damaged shipments |
| Live truck map | GPS positions of fleet vehicles |
| Branch oversight | Branch network status |
| Vehicle fleet | Vehicle registration and assignment |
| Reports | Operational and performance reports |
| Analytics | Platform-wide KPIs |

---

## 10. Support Features

| Feature | Description |
|---------|-------------|
| Ticket queue | Incoming support requests |
| Threaded conversations | Customer and internal messages |
| Order lookup | Search orders on behalf of customers |
| Refund processing | Initiate and track refunds |
| Knowledge base | Self-service article management |
| Notification inbox | Support team alerts |

---

## 11. Finance Features

| Feature | Description |
|---------|-------------|
| Payment ledger | All platform transactions |
| Invoice management | Issue, view, update invoice status |
| Refund reconciliation | Process and track refunds |
| Revenue analytics | Revenue trends and breakdowns |
| Tax reporting | Tax calculation and reports |
| Insurance claims | Review and approve claims |

---

## 12. Admin Features

| Feature | Description |
|---------|-------------|
| User management | CRUD, role assignment |
| Role/permission admin | Fine-grained access control |
| Platform analytics | Charts, KPIs, trends |
| Pricing rules | Configure service tiers |
| Coupon management | Create and manage discount codes |
| Audit logs | Security-sensitive change history |
| Activity logs | Operational event history |
| Merchant management | Onboard and manage merchants |
| Branch management | Configure branch network |
| Warehouse management | Configure warehouse facilities |

---

## 13. Cross-Cutting Features

| Feature | Implementation |
|---------|----------------|
| Realtime updates | Socket.IO across web and mobile |
| Notifications | In-app, push (Expo), email, SMS |
| File uploads | POD photos, avatars, documents |
| Maps | OpenStreetMap + OSRM routing (free) |
| Search | Cross-entity search endpoint |
| Reviews | Post-delivery ratings |
| Loyalty | Points accumulation and redemption |
| Offline mobile | Queued operations with auto-retry |
| Biometric login | Face ID / fingerprint on mobile |
| Audit trail | All sensitive changes logged |

---

*End of Chapter 7.*
