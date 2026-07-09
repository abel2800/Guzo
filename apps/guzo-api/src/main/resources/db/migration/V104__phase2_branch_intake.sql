-- Phase 2 — Branch intake metadata (photo + measured weight)

ALTER TABLE "guzo_branch_inventory" ADD COLUMN IF NOT EXISTS "photoFileId" TEXT;
ALTER TABLE "guzo_branch_inventory" ADD COLUMN IF NOT EXISTS "measuredWeightKg" NUMERIC(10, 2);
