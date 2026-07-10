-- AlterEnum
ALTER TYPE "VehicleType" ADD VALUE IF NOT EXISTS 'ELECTRIC_BIKE';

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "photoFileId" TEXT;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_photoFileId_fkey" FOREIGN KEY ("photoFileId") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
