CREATE TABLE IF NOT EXISTS "city_pricing_zones" (
  "id" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "zoneName" TEXT NOT NULL,
  "multiplier" DECIMAL(5,2) NOT NULL DEFAULT 1,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "city_pricing_zones_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "city_pricing_zones_city_key" ON "city_pricing_zones"("city");
CREATE INDEX IF NOT EXISTS "city_pricing_zones_city_idx" ON "city_pricing_zones"("city");
