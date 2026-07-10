# Chapter 9 — Security

| Field | Value |
|-------|-------|
| **Chapter** | 9 of 12 |
| **Title** | Security Model |

---

## Table of Contents

1. [Security Overview](#1-security-overview)
2. [Authentication](#2-authentication)
3. [Authorization (RBAC)](#3-authorization-rbac)
4. [Role Definitions](#4-role-definitions)
5. [Permission Model](#5-permission-model)
6. [Transport Security](#6-transport-security)
7. [Input Validation](#7-input-validation)
8. [Rate Limiting](#8-rate-limiting)
9. [Audit & Logging](#9-audit--logging)
10. [File Upload Security](#10-file-upload-security)
11. [Production Hardening Checklist](#11-production-hardening-checklist)

---

## 1. Security Overview

GUZO implements defense in depth across all tiers:

| Layer | Mechanism |
|-------|-----------|
| Transport | HTTPS (production), Helmet security headers |
| Authentication | JWT access + refresh tokens with rotation |
| Authorization | Role-based + fine-grained permission checks |
| Input | Server-side validation on every endpoint |
| Rate limiting | Auth endpoint throttling |
| Password storage | Bcrypt hashing |
| Audit | Activity and audit logs for sensitive operations |
| File uploads | Type/size validation, isolated storage |

---

## 2. Authentication

### 2.1 Registration

- Email uniqueness enforced at database level
- Password minimum requirements validated server-side
- Default role assigned (CUSTOMER) unless specified by admin invite
- Bcrypt hash stored; plaintext never persisted

### 2.2 Login

- Returns access token (15 min) and refresh token (7 days)
- Refresh token stored hashed in `refresh_tokens` table
- Failed login attempts are rate-limited
- Session tracked in `sessions` table

### 2.3 Token Refresh

- Client sends refresh token to `POST /auth/refresh`
- Server validates, rotates refresh token, issues new access token
- Old refresh token is invalidated (rotation prevents replay)

### 2.4 Logout

- `POST /auth/logout` revokes the refresh token
- Client clears local token storage

### 2.5 Password Reset

- `POST /auth/forgot-password` accepts **email** or **phone**
- **Phone:** sends OTP via `/otp`; user completes reset at `POST /auth/reset-password` with verified OTP
- **Email:** generates a time-limited reset token (legacy flow)
- Reset tokens and OTP verifications are single-use / short-lived

### 2.6 Phone OTP (signup)

- `POST /otp/send` and `POST /otp/verify` are public, rate-limited endpoints
- `POST /auth/register` calls `otpService.assertRecentlyVerified(phone)` when a phone number is provided
- In development, OTP codes log to the Node API console as `[OTP stub]`

### 2.7 Mobile Biometrics

Mobile apps support Face ID / fingerprint as a convenience layer over stored credentials. Biometric unlock retrieves tokens from secure storage (Expo SecureStore); it does not replace server-side authentication.

---

## 3. Authorization (RBAC)

### 3.1 Middleware Pipeline

```
Request
  → authenticate()        Verify JWT, attach user to request
  → authorize(...roles)   Check user has at least one required role
  → authorizePermission() Check user has required permission keys
  → handler()
```

### 3.2 SUPER_ADMIN Bypass

Users with the `SUPER_ADMIN` role bypass all `authorizePermission` checks. This role should be assigned sparingly.

### 3.3 Data Scoping

Beyond RBAC, services apply data scoping:

| Role | Data Scope |
|------|------------|
| CUSTOMER | Own orders and addresses only |
| DRIVER | Assigned deliveries only |
| MERCHANT | Own merchant orders only |
| BRANCH_STAFF | Own branch inventory only |
| WAREHOUSE_STAFF | Own warehouse inventory only |
| ADMIN+ | Platform-wide access |

---

## 4. Role Definitions

| Role | Purpose | Primary Clients |
|------|---------|-----------------|
| SUPER_ADMIN | Unrestricted platform access | Web |
| ADMIN | Platform administration | Web |
| OPERATIONS_MANAGER | Dispatch, tracking, orchestration | Web |
| WAREHOUSE_MANAGER | Warehouse domain management | Web |
| WAREHOUSE_STAFF | Package receive/sort/dispatch | Web |
| BRANCH_STAFF | Counter, receive, shelf, pickup | Web, Branch mobile |
| DRIVER | Accept deliveries, GPS, POD | Web, Driver mobile |
| MERCHANT | Create orders, bulk upload, API keys | Web, Merchant mobile |
| CUSTOMER | Book and track shipments | Web, Customer mobile |
| SUPPORT | Handle support tickets | Web |
| FINANCE | Payments, invoices, revenue | Web |

### 4.1 Multi-Role Users

When a user holds multiple roles, the web dashboard selects the highest-priority role:

```
SUPER_ADMIN > ADMIN > OPERATIONS_MANAGER > FINANCE > WAREHOUSE_MANAGER
> WAREHOUSE_STAFF > BRANCH_STAFF > SUPPORT > MERCHANT > DRIVER > CUSTOMER
```

---

## 5. Permission Model

### 5.1 Format

Permissions use the `resource.action` pattern:

```
orders.create
orders.read
orders.update
orders.delete
payments.read
tracking.create
warehouses.dispatch
branches.receive
```

### 5.2 Assignment

Permissions are assigned to roles via the `role_permissions` table. The seed script creates 90+ permissions mapped across 11 roles.

### 5.3 Checking

The `authorizePermission('orders.create', 'orders.read')` middleware requires the user to hold **all** listed permissions (unless SUPER_ADMIN).

---

## 6. Transport Security

| Mechanism | Development | Production |
|-----------|-------------|------------|
| HTTPS | Optional (localhost) | **Required** |
| Helmet | Enabled | Enabled |
| CORS | Configured origins | Strict origin whitelist |
| Cookie flags | — | HttpOnly, Secure, SameSite |

Configure `CORS_ORIGINS` in `apps/server/.env` to list all frontend origins.

---

## 7. Input Validation

Every mutating endpoint passes through `validate()` middleware using express-validator schemas defined in each module's `*.validator.ts` file.

| Validation | Applied To |
|------------|------------|
| Type coercion | Query params, body fields |
| Format checks | Email, phone, UUID, dates |
| Length limits | Strings, arrays |
| Enum validation | Status fields, role fields |
| Custom rules | Business logic constraints |

Validation errors return HTTP 400 with field-level error details.

---

## 8. Rate Limiting

| Endpoint Group | Limit | Window |
|----------------|-------|--------|
| `/auth/login` | Configurable | Per IP |
| `/auth/register` | Configurable | Per IP |
| `/auth/forgot-password` | Configurable | Per IP |

Rate limiting is implemented via `rateLimit.middleware.ts` and applies before authentication.

---

## 9. Audit & Logging

### 9.1 Audit Logs

Recorded in `audit_logs` table for security-sensitive operations:

- User role changes
- Permission modifications
- Payment status changes
- Admin configuration changes

### 9.2 Activity Logs

Recorded in `activity_logs` for general operational tracking:

- Order status changes
- Package scans
- Manifest departures/arrivals

### 9.3 Application Logging

Winston logger with size-capped file rotation. Log level controlled by `LOG_LEVEL` environment variable.

---

## 10. File Upload Security

| Control | Implementation |
|---------|----------------|
| Size limit | Multer configuration per upload type |
| Type filter | MIME type and extension validation |
| Storage isolation | Files stored outside web root |
| Access control | Authenticated endpoints for upload; signed URLs for retrieval |
| POD photos | Driver role required |
| Avatars | Owner or admin only |

---

## 11. Production Hardening Checklist

| Item | Action |
|------|--------|
| JWT secrets | Generate cryptographically random 64+ character strings |
| DATABASE_URL | Use managed PostgreSQL with SSL |
| CORS | Restrict to production domains only |
| HTTPS | Terminate TLS at load balancer or reverse proxy |
| Rate limits | Tune for expected traffic |
| File storage | Switch to S3/MinIO with bucket policies |
| Email | Configure SMTP or transactional email service |
| Payments | Switch from `fake` to production payment provider |
| Logging | Ship logs to centralized monitoring |
| Backups | Schedule automated database backups |
| Dependencies | Run `npm audit` regularly |

---

*End of Chapter 9.*
