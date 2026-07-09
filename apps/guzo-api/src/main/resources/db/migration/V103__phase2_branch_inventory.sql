-- Phase 2 — Branch parcel inventory (shelf tracking at hub counters)

CREATE TABLE IF NOT EXISTS "guzo_branch_inventory" (
    "id" TEXT PRIMARY KEY,
    "branchId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL UNIQUE,
    "shelfCode" TEXT,
    "zone" TEXT,
    "receivedAt" TIMESTAMPTZ NOT NULL,
    "pickedUpAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "guzo_branch_inventory_branch_fkey" FOREIGN KEY ("branchId") REFERENCES "guzo_branches"("id") ON DELETE CASCADE,
    CONSTRAINT "guzo_branch_inventory_package_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "guzo_branch_inventory_branch_idx" ON "guzo_branch_inventory"("branchId");
CREATE INDEX IF NOT EXISTS "guzo_branch_inventory_shelf_idx" ON "guzo_branch_inventory"("branchId", "shelfCode");
