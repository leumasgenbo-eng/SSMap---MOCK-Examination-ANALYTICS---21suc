-- UNITED BAYLOR ACADEMY (UBA) - DATABASE SCHEMA
-- Execute this in the Supabase SQL Editor

-- 1. PERSISTENCE TABLE
-- Handles settings, student data, facilitator assignments, and registry entries.
CREATE TABLE IF NOT EXISTS public.uba_persistence (
  id TEXT PRIMARY KEY,                       -- e.g., 'UBA-2025-001_settings', 'registry_UBA-2025-001'
  payload JSONB NOT NULL,                    -- The actual data object
  last_updated TIMESTAMPTZ DEFAULT NOW(),    -- Timestamp for sync resolution
  user_id UUID DEFAULT auth.uid()            -- Owner reference
    REFERENCES auth.users(id) 
    ON DELETE CASCADE
);

-- 2. SECURITY CONFIGURATION (RLS)
ALTER TABLE public.uba_persistence ENABLE ROW LEVEL SECURITY;

-- Policy: Owners manage their own institutional data
-- Allows schools to read/write their own students and settings.
CREATE POLICY "Institutions manage own data" ON public.uba_persistence
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Public Institutional Discovery
-- Allows the login portal to verify a Hub ID exists before attempting authentication.
-- This is critical for the "registry_*" prefix used in the app.
CREATE POLICY "Network registry discovery" ON public.uba_persistence
FOR SELECT TO anon, authenticated
USING (id LIKE 'registry_%');

-- Policy: HQ Master Access
-- Optional: If you have a specific HQ User ID, you can grant them full override access.
-- CREATE POLICY "HQ Master Access" ON public.uba_persistence
-- FOR ALL TO authenticated
-- USING (auth.uid() = 'YOUR-HQ-USER-UUID-HERE');

-- 3. INDEXING FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_uba_persistence_user_id ON public.uba_persistence(user_id);
CREATE INDEX IF NOT EXISTS idx_uba_persistence_registry ON public.uba_persistence(id) WHERE id LIKE 'registry_%';

-- 4. REAL-TIME ENABLEMENT
-- Ensure the table is added to the 'supabase_realtime' publication for live syncing.
ALTER PUBLICATION supabase_realtime ADD TABLE public.uba_persistence;