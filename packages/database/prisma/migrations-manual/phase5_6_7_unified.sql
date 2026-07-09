
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "loyaltyPoints" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "referralCode" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "referredById" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "customers_referralCode_key" ON "customers"("referralCode") WHERE "referralCode" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "city_pricing_zones" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "city" TEXT NOT NULL UNIQUE,
  "zoneName" TEXT NOT NULL,
  "multiplier" DECIMAL(5,2) NOT NULL DEFAULT 1,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "city_pricing_zones_city_idx" ON "city_pricing_zones"("city");

CREATE TABLE IF NOT EXISTS "pricing_rules" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "deliveryType" TEXT NOT NULL DEFAULT 'STANDARD',
  "baseFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "perKmFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "perKgFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "minFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "surgeMultiplier" DECIMAL(5,2) NOT NULL DEFAULT 1,
  "taxPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'ETB',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "coupons" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "type" TEXT NOT NULL DEFAULT 'PERCENTAGE',
  "value" DECIMAL(12,2) NOT NULL,
  "maxDiscount" DECIMAL(12,2),
  "minOrderAmount" DECIMAL(12,2),
  "usageLimit" INTEGER,
  "perUserLimit" INTEGER NOT NULL DEFAULT 1,
  "usedCount" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "startsAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "coupon_usages" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "couponId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "orderId" TEXT UNIQUE,
  "discount" DECIMAL(12,2) NOT NULL,
  "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "coupon_usages_couponId_idx" ON "coupon_usages"("couponId");
CREATE INDEX IF NOT EXISTS "coupon_usages_userId_idx" ON "coupon_usages"("userId");

CREATE TABLE IF NOT EXISTS "reviews" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "authorId" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "orderId" TEXT,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "reviews_targetType_targetId_idx" ON "reviews"("targetType", "targetId");

CREATE TABLE IF NOT EXISTS "insurance_claims" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orderId" TEXT NOT NULL UNIQUE,
  "customerId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
  "description" TEXT,
  "amountClaimed" DECIMAL(12,2),
  "resolutionNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "insurance_claims_customerId_idx" ON "insurance_claims"("customerId");
CREATE INDEX IF NOT EXISTS "insurance_claims_status_idx" ON "insurance_claims"("status");

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "before" JSONB,
  "after" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "audit_logs_actorId_idx" ON "audit_logs"("actorId");
CREATE INDEX IF NOT EXISTS "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

CREATE TABLE IF NOT EXISTS "activity_logs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT,
  "action" TEXT NOT NULL,
  "metadata" JSONB,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "activity_logs_userId_idx" ON "activity_logs"("userId");
CREATE INDEX IF NOT EXISTS "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");