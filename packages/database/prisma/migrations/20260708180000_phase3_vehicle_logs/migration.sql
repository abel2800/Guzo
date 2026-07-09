CREATE TYPE "VehicleLogType" AS ENUM ('FUEL', 'MAINTENANCE', 'MILEAGE', 'INSPECTION');

CREATE TABLE "vehicle_logs" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "type" "VehicleLogType" NOT NULL,
    "odometerKm" DECIMAL(10,2),
    "amount" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "note" TEXT,
    "metadata" JSONB,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "vehicle_logs_vehicleId_idx" ON "vehicle_logs"("vehicleId");
CREATE INDEX "vehicle_logs_driverId_idx" ON "vehicle_logs"("driverId");

ALTER TABLE "vehicle_logs" ADD CONSTRAINT "vehicle_logs_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vehicle_logs" ADD CONSTRAINT "vehicle_logs_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;