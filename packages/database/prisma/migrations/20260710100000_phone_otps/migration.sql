-- Phone OTP for registration verification (dev stub — code logged on server)
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
