# GUZO Changelog

| Field | Value |
|-------|-------|
| **Product** | GUZO — Enterprise Logistics & Delivery Platform |
| **Format** | Keep a Changelog (informal) |

---

## [Unreleased] — July 2026

### Authentication & OTP

- **Phone OTP on signup** — Registration on web and all four mobile apps verifies the phone number via OTP before account creation (`POST /otp/send`, `POST /otp/verify`; enforced in `POST /auth/register` when `phone` is provided).
- **Forgot password with OTP** — `POST /auth/forgot-password` accepts email or phone. Phone flow sends an OTP; `POST /auth/reset-password` completes reset with OTP (phone) or legacy email token.
- **Dev stub** — In development, OTP codes are logged to the Node API terminal as `[OTP stub]`.

### Admin approval fix

- Super-admin approval of drivers, merchants, and branch staff now sets `user.status` to `ACTIVE`, so approved accounts can log in immediately.
- Merchant profile approval is linked via `approveLinkedProfiles` in the users repository.

### Pickup & delivery journey

- **Pickup codes** — Barcode, QR, and short PIN assigned when a customer order is created; shown to senders/receivers on web and customer mobile.
- **Driver scan pickup** — `POST /orders/:id/scan-pickup` with `{ reference }` validates the code and moves the order to `PICKED_UP`.
- **Slide-to-confirm actions** — Shared `SlideToConfirm` component on driver mobile and web for trip start, arrival, and similar high-intent actions.
- **Driver arrived** — `POST /orders/:id/arrived` notifies the receiver (in-app notification + SMS when configured).
- **Call receiver** — Driver delivery screens expose one-tap call to the receiver phone number.
- **Branch receive → receiver notify** — After branch staff receive a package, receivers are notified when status becomes `READY_FOR_PICKUP`.

### Driver vehicle profile

- Drivers can register vehicle type (including **electric bike**), plate number, and photo via `PUT /drivers/me/vehicle` and `POST /drivers/me/vehicle/photo`.
- Customer tracking surfaces driver photo, vehicle type, and plate on active deliveries.

### Driver job pool

- Unassigned orders with status `CONFIRMED` or `AT_BRANCH` appear in the driver available-jobs pool (branch-dropped and confirmed home pickups).

### Receiver lookup

- `GET /receivers/lookup?phone=&guzoId=` — Authenticated lookup for receiver details when booking or at counter.

### Responsive UI & navigation

- **Web** — Dashboard stat cards link to filtered sections; notification center deep-links to orders; driver pickup scan dialog; order bucket filters on customer my-orders; clickable rows across admin, branch, and driver tables.
- **Mobile (all four apps)** — Stats, promos, inventory rows, notifications, receipts, and job cards navigate to the relevant detail screen via shared `notification-routes` helpers.

### New API modules

| Prefix | Purpose |
|--------|---------|
| `/otp` | Send and verify one-time passwords |
| `/receivers` | Receiver lookup by phone or GUZO ID |

### Schema

- `Vehicle.photoFileId`, `ELECTRIC_BIKE` vehicle type, `Delivery.vehicle` relation.
- Migration: `packages/database/prisma/migrations/20260710120000_vehicle_photo_electric_bike/`.

### Shared packages

| Package | Additions |
|---------|-----------|
| `@guzo/mobile-ui` | `SlideToConfirm`, `ParcelQrCode` |
| `@guzo/mobile-shared` | OTP helpers, `notification-routes` |
| `apps/web/src/lib` | `notification-routes.ts`, `profile.ts` |

---

## Earlier releases

See git history and [Features & Roles](features-and-roles.md) for the baseline platform: dual API, RBAC, order lifecycle, warehouse/branch ops, four mobile apps, web dashboard, marketing site, Socket.IO realtime, and Prisma schema.

---

*For endpoint tables and client screen maps, see [API Servers](api-servers.md), [Mobile Applications](mobile-apps.md), and [Web Dashboard](web-dashboard.md).*
