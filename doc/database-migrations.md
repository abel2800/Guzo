# Manual SQL migrations

Prisma migrations in `packages/database/prisma/migrations/` cover the baseline schema. Additional phase SQL lives in `packages/database/prisma/migrations-manual/` and must be applied **after** `prisma migrate deploy` when bringing up a fresh database.

## Apply order

| Order | File | Purpose |
|-------|------|---------|
| 1 | `phase5_6_7_unified.sql` | Loyalty fields, city pricing zones, pricing rules, platform tables (phases 5–7) |
| 2 | `city_pricing_zones.sql` | Seed / adjust city zone multipliers (idempotent) |
| 3 | `phase7_platform.sql` | Phase 7 platform extensions (reviews, insurance, referrals) |

## Commands

From the repo root, with `DATABASE_URL` set:

```bash
cd packages/database
npx prisma migrate deploy

psql "$DATABASE_URL" -f prisma/migrations-manual/phase5_6_7_unified.sql
psql "$DATABASE_URL" -f prisma/migrations-manual/city_pricing_zones.sql
psql "$DATABASE_URL" -f prisma/migrations-manual/phase7_platform.sql
```

On Windows PowerShell, use `psql` with `-f` and a full path, or paste file contents into your SQL client.

## Notes

- Files use `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` where possible — safe to re-run on partially migrated DBs.
- Java API uses Flyway (`V100+`) for the same phase tables; keep Node manual SQL and Flyway scripts logically aligned.
- `PaymentMethod.FAKE` remains in the Prisma enum for local development only. Production UIs hide it; the Node API rejects `FAKE` when `NODE_ENV=production`.
