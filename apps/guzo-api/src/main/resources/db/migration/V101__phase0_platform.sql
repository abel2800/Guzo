-- Phase 0 platform: branch staff, webhooks, merchant API extensions

INSERT INTO roles (id, name, description, "isSystem", "createdAt", "updatedAt")
SELECT 'role_branch_staff', 'BRANCH_STAFF', 'Branch counter and pickup staff', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'BRANCH_STAFF');

CREATE TABLE IF NOT EXISTS "guzo_branch_staff" (
    "userId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "guzo_branch_staff_pkey" PRIMARY KEY ("userId", "branchId"),
    CONSTRAINT "guzo_branch_staff_branch_fkey" FOREIGN KEY ("branchId") REFERENCES "guzo_branches"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "guzo_merchant_webhooks" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT NOT NULL DEFAULT 'parcel.status_changed',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "guzo_merchant_webhooks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "guzo_merchant_webhooks_merchant_idx" ON "guzo_merchant_webhooks"("merchantId");

CREATE TABLE IF NOT EXISTS "guzo_webhook_deliveries" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    CONSTRAINT "guzo_webhook_deliveries_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "guzo_webhook_deliveries_webhook_fkey" FOREIGN KEY ("webhookId") REFERENCES "guzo_merchant_webhooks"("id") ON DELETE CASCADE
);

-- Phone OTP for verification (Phase 0 stub storage)
CREATE TABLE IF NOT EXISTS "guzo_phone_otps" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "guzo_phone_otps_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "guzo_phone_otps_phone_idx" ON "guzo_phone_otps"("phone");
