
DO $$ BEGIN
    CREATE TYPE "ManifestStatus" AS ENUM ('DRAFT', 'SEALED', 'IN_TRANSIT', 'ARRIVED', 'UNLOADED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "transport_manifests" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "transport_manifests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "transport_manifests_manifestNumber_key" ON "transport_manifests"("manifestNumber");
CREATE INDEX IF NOT EXISTS "transport_manifests_originWarehouseId_idx" ON "transport_manifests"("originWarehouseId");
CREATE INDEX IF NOT EXISTS "transport_manifests_destinationWarehouseId_idx" ON "transport_manifests"("destinationWarehouseId");
CREATE INDEX IF NOT EXISTS "transport_manifests_status_idx" ON "transport_manifests"("status");

CREATE TABLE IF NOT EXISTS "manifest_parcels" (
    "id" TEXT NOT NULL,
    "manifestId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "scannedByUserId" TEXT,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unloadedAt" TIMESTAMP(3),
    CONSTRAINT "manifest_parcels_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "manifest_parcels_manifestId_packageId_key" ON "manifest_parcels"("manifestId", "packageId");
CREATE INDEX IF NOT EXISTS "manifest_parcels_packageId_idx" ON "manifest_parcels"("packageId");

ALTER TABLE "transport_manifests" ADD CONSTRAINT "transport_manifests_originWarehouseId_fkey" FOREIGN KEY ("originWarehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transport_manifests" ADD CONSTRAINT "transport_manifests_destinationWarehouseId_fkey" FOREIGN KEY ("destinationWarehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transport_manifests" ADD CONSTRAINT "transport_manifests_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "manifest_parcels" ADD CONSTRAINT "manifest_parcels_manifestId_fkey" FOREIGN KEY ("manifestId") REFERENCES "transport_manifests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "manifest_parcels" ADD CONSTRAINT "manifest_parcels_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;