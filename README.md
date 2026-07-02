# Delivery Platform

An **enterprise-grade logistics & delivery platform** (think SF Express / FedEx / DHL / UPS / Uber Delivery / Amazon Logistics) built as a **modular monolith**.

- **Local-first**: runs entirely on one machine, no cloud required.
- **Free & open-source**: PostgreSQL, Prisma, Node/Express, Next.js, Leaflet/OSRM, Socket.IO. No paid APIs.
- **Cloud-ready**: clean module boundaries, provider abstractions (storage / payments / SMS / push), and an optional Redis layer so you can later split into microservices, add Docker/Kubernetes, Redis clusters and CI/CD **without rewriting the core**.

---

## Monorepo Layout

```
delivery-platform/
├── apps/
│   ├── customer-web/        # Next.js 15 customer portal
│   ├── admin-dashboard/     # Next.js 15 admin console
│   ├── merchant-dashboard/  # Next.js 15 merchant console
│   ├── driver-dashboard/    # Next.js 15 driver app
│   └── server/              # Express modular-monolith API (the heart)
├── packages/
│   ├── ui/                  # Shared React/Shadcn components
│   ├── types/               # Shared TypeScript types (API contracts)
│   ├── utils/               # Shared isomorphic utilities
│   ├── config/              # Shared config (eslint/tsconfig presets, constants)
│   └── database/            # Prisma schema + client + seed (single source of truth)
├── docs/                    # Architecture, DB design, flows, migration plan
├── docker/                  # docker-compose for local infra (Postgres/Redis/Mailpit/MinIO)
└── scripts/                 # Dev/ops helper scripts
```

## Tech Stack

| Layer        | Technology                                                                       |
| ------------ | -------------------------------------------------------------------------------- |
| Frontend     | Next.js 15, React 19, TypeScript, Tailwind, Shadcn UI, Framer Motion, React Query, React Hook Form, Zod, Axios, Leaflet+OSM, Socket.IO client |
| Backend      | Node.js, Express, TypeScript, Prisma, JWT + refresh tokens, Bcrypt, Multer, Socket.IO, express-validator, Helmet, CORS, Morgan, Winston, Nodemailer |
| Database     | PostgreSQL (Prisma ORM). Redis **optional**.                                      |
| Maps         | OpenStreetMap + Leaflet + OSRM (no paid APIs)                                     |
| Realtime     | Socket.IO (tracking, notifications, driver status, chat, admin live dashboard)   |
| Storage      | Local filesystem now → S3/MinIO later (driver abstraction)                        |
| Payments     | Fake provider now → Stripe/Chapa/Telebirr/PayPal/etc. later (provider abstraction) |

## Prerequisites

- Node.js >= 20
- PostgreSQL 16 (or run `npm run docker:up` to get it via Docker)

## Quick Start

```bash
# 1. Install all workspaces
npm install

# 2. Start local infrastructure (Postgres, + optional Redis/Mailpit/MinIO)
npm run docker:up          # OR run your own local PostgreSQL

# 3. Configure environment
cp .env.example .env       # adjust if needed
cp .env apps/server/.env   # the server reads its own .env (symlink or copy)

# 4. Set up the database
npm run db:generate
npm run db:migrate
npm run db:seed

# 5. Run the API
npm run dev:server         # http://localhost:4000/api/v1

# 6. Run a frontend (in another terminal)
npm run dev:customer       # http://localhost:3000
```

> Health check: `GET http://localhost:4000/health`

## Documentation

See [`docs/`](./docs):

- [Architecture](./docs/ARCHITECTURE.md)
- [Database Design](./docs/DATABASE.md)
- [API Reference](./docs/API.md)
- [Auth & RBAC Flow](./docs/AUTH_RBAC.md)
- [Realtime / Socket.IO Flow](./docs/REALTIME.md)
- [Request Lifecycle & Middleware Pipeline](./docs/REQUEST_LIFECYCLE.md)
- [File Upload Flow](./docs/FILE_UPLOAD.md)
- [Cloud Migration Plan](./docs/CLOUD_MIGRATION.md)
- [Development Workflow](./docs/DEVELOPMENT.md)

## License

MIT — for learning and internal use.
