-- ============================================================================
-- GUZO Phase 0 — Java backend foundation (Flyway V100+)
-- Adds Cainiao-style network primitives on top of the existing Prisma schema.
-- ============================================================================

-- Permanent public Guzo ID for every user (e.g. GZ-284651)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "guzoId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "users_guzoId_key" ON "users"("guzoId");

-- Extended order statuses for branch network
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'AT_BRANCH';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'AT_DESTINATION_BRANCH';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'READY_FOR_PICKUP';

-- Pickup method on orders
DO $$ BEGIN
  CREATE TYPE "PickupMethod" AS ENUM (
    'COMPANY_PICKUP',
    'DROP_AT_BRANCH',
    'BRANCH_PICKUP'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "pickupMethod" "PickupMethod";
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "insuranceAmount" DECIMAL(12,2);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "hasInsurance" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "receiverUserId" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "receiverGuzoId" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "receiverPhone" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "originBranchId" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "destinationBranchId" TEXT;

-- Pickup PIN for branch collection
ALTER TABLE "packages" ADD COLUMN IF NOT EXISTS "pickupPin" TEXT;
CREATE INDEX IF NOT EXISTS "packages_pickupPin_idx" ON "packages"("pickupPin");

-- Branch network
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

-- Family parcel management
DO $$ BEGIN
  CREATE TYPE "FamilyRelation" AS ENUM (
    'SPOUSE',
    'CHILD',
    'PARENT',
    'SIBLING',
    'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "guzo_family_members" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "memberUserId" TEXT NOT NULL,
    "relation" "FamilyRelation" NOT NULL DEFAULT 'OTHER',
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "guzo_family_members_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "guzo_family_members_owner_member_key" UNIQUE ("ownerUserId", "memberUserId")
);
CREATE INDEX IF NOT EXISTS "guzo_family_members_owner_idx" ON "guzo_family_members"("ownerUserId");

-- Intercity transport manifests
DO $$ BEGIN
  CREATE TYPE "ManifestStatus" AS ENUM (
    'DRAFT',
    'SEALED',
    'IN_TRANSIT',
    'ARRIVED',
    'UNLOADED',
    'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "guzo_transport_manifests" (
    "id" TEXT NOT NULL,
    "manifestNumber" TEXT NOT NULL,
    "originWarehouseId" TEXT,
    "destinationWarehouseId" TEXT,
    "driverId" TEXT,
    "vehicleId" TEXT,
    "sealNumber" TEXT,
    "status" "ManifestStatus" NOT NULL DEFAULT 'DRAFT',
    "departedAt" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "guzo_transport_manifests_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "guzo_transport_manifests_number_key" ON "guzo_transport_manifests"("manifestNumber");

CREATE TABLE IF NOT EXISTS "guzo_manifest_parcels" (
    "id" TEXT NOT NULL,
    "manifestId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scannedByUserId" TEXT,
    CONSTRAINT "guzo_manifest_parcels_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "guzo_manifest_parcels_manifest_package_key" UNIQUE ("manifestId", "packageId"),
    CONSTRAINT "guzo_manifest_parcels_manifest_fkey" FOREIGN KEY ("manifestId") REFERENCES "guzo_transport_manifests"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "guzo_manifest_parcels_package_idx" ON "guzo_manifest_parcels"("packageId");

-- Seed core Ethiopian branches (sample)
INSERT INTO "guzo_branches" ("id", "code", "name", "line1", "city", "latitude", "longitude", "phone", "openingHours", "queueLevel")
VALUES
  ('br_add_bole', 'BR-ADD-BOLE', 'Guzo Bole', 'Bole Road', 'Addis Ababa', 8.9972, 38.7897, '+251911000001', 'Mon-Sat 8:00-20:00', 2),
  ('br_add_piassa', 'BR-ADD-PIASSA', 'Guzo Piassa', 'Churchill Ave', 'Addis Ababa', 9.0336, 38.7465, '+251911000002', 'Mon-Sat 8:00-20:00', 1),
  ('br_haw_center', 'BR-HAW-CTR', 'Guzo Hawassa', 'Main Street', 'Hawassa', 7.0621, 38.4764, '+251911000003', 'Mon-Sat 8:00-18:00', 0),
  ('br_adm_center', 'BR-ADM-CTR', 'Guzo Adama', 'Station Road', 'Adama', 8.5400, 39.2700, '+251911000004', 'Mon-Sat 8:00-18:00', 0)
ON CONFLICT DO NOTHING;
