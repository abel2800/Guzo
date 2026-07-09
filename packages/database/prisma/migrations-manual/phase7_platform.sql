ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "referralCode" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "referredById" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "customers_referralCode_key" ON "customers"("referralCode");

CREATE TABLE IF NOT EXISTS "insurance_claims" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
  "description" TEXT,
  "amountClaimed" DECIMAL(12,2),
  "resolutionNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "insurance_claims_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "insurance_claims_orderId_key" ON "insurance_claims"("orderId");
CREATE INDEX IF NOT EXISTS "insurance_claims_customerId_idx" ON "insurance_claims"("customerId");
CREATE INDEX IF NOT EXISTS "insurance_claims_status_idx" ON "insurance_claims"("status");
