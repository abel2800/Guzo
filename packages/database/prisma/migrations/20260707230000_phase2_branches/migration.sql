
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'AT_BRANCH';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'AT_DESTINATION_BRANCH';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'READY_FOR_PICKUP';

DO $$ BEGIN
  CREATE TYPE "PickupMethod" AS ENUM ('COMPANY_PICKUP', 'DROP_AT_BRANCH', 'BRANCH_PICKUP');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE "PackageStatus" ADD VALUE IF NOT EXISTS 'AT_BRANCH';
ALTER TYPE "PackageStatus" ADD VALUE IF NOT EXISTS 'READY_FOR_PICKUP';

ALTER TYPE "TrackingEventType" ADD VALUE IF NOT EXISTS 'ARRIVED_AT_BRANCH';

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "pickupMethod" "PickupMethod";
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "hasInsurance" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "insuranceAmount" DECIMAL(12,2);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "receiverUserId" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "receiverGuzoId" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "receiverPhone" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "originBranchId" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "destinationBranchId" TEXT;

ALTER TABLE "packages" ADD COLUMN IF NOT EXISTS "pickupPin" TEXT;
CREATE INDEX IF NOT EXISTS "packages_pickupPin_idx" ON "packages"("pickupPin");

CREATE TABLE IF NOT EXISTS "guzo_branches" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'ET',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "phone" TEXT,
    "openingHours" TEXT,
    "queueLevel" INTEGER NOT NULL DEFAULT 0,
    "warehouseId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "guzo_branches_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "guzo_branches_code_key" ON "guzo_branches"("code");
CREATE INDEX IF NOT EXISTS "guzo_branches_city_idx" ON "guzo_branches"("city");

CREATE TABLE IF NOT EXISTS "guzo_branch_staff" (
    "userId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "guzo_branch_staff_pkey" PRIMARY KEY ("userId", "branchId"),
    CONSTRAINT "guzo_branch_staff_branch_fkey" FOREIGN KEY ("branchId") REFERENCES "guzo_branches"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "guzo_branch_inventory" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "shelfCode" TEXT,
    "zone" TEXT,
    "receivedAt" TIMESTAMPTZ NOT NULL,
    "pickedUpAt" TIMESTAMPTZ,
    "photoFileId" TEXT,
    "measuredWeightKg" DECIMAL(10, 2),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "guzo_branch_inventory_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "guzo_branch_inventory_branch_fkey" FOREIGN KEY ("branchId") REFERENCES "guzo_branches"("id") ON DELETE CASCADE,
    CONSTRAINT "guzo_branch_inventory_package_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "guzo_branch_inventory_packageId_key" ON "guzo_branch_inventory"("packageId");
CREATE INDEX IF NOT EXISTS "guzo_branch_inventory_branch_idx" ON "guzo_branch_inventory"("branchId");
CREATE INDEX IF NOT EXISTS "guzo_branch_inventory_shelf_idx" ON "guzo_branch_inventory"("branchId", "shelfCode");