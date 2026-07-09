-- Phase 4 — manifest unload tracking

ALTER TABLE "guzo_manifest_parcels" ADD COLUMN IF NOT EXISTS "unloadedAt" TIMESTAMPTZ;
