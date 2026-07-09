-- Extend PaymentMethod enum for Ethiopian providers (Phase 0)
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'TELEBIRR';
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'CBE';
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'CHAPA';
