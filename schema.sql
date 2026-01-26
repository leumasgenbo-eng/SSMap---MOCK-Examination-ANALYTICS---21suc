-- UNITED BAYLOR ACADEMY (UBA) - DATABASE SCHEMA (REFINED)
-- Execute this in the Supabase SQL Editor

-- 1. PERSISTENCE TABLE
-- Handles settings, student data, facilitator assignments, and registry entries.
CREATE TABLE IF NOT EXISTS public.uba_persistence (
  id TEXT PRIMARY KEY,                       -- e.g., 'UBA-2025-001_settings', 'registry_UBA-2025-001'
  payload JSONB NOT NULL,                    -- The actual data object
  last_updated TIMESTAMPTZ DEFAULT NOW(),    -- Timestamp for sync resolution
  user_id UUID                               -- Owner reference
);

-- Note: We decouple the strict FK constraint during the initial creation phase to prevent race conditions 
-- with Supabase Auth identities. RLS remains the primary security layer.
-- If you strictly need the FK enforcement, you can run the following manually later:
-- ALTER TABLE public.uba_persistence ADD CONSTRAINT uba_persistence_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. SECURITY CONFIGURATION (RLS)
ALTER TABLE public.uba_persistence ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts during update
DROP POLICY IF EXISTS "Enable initial registration" ON public.uba_persistence;
DROP POLICY IF EXISTS "Public registry discovery" ON public.uba_persistence;
DROP POLICY IF EXISTS "Owners manage own data" ON public.uba_persistence;
DROP POLICY IF EXISTS "Institutions manage own data" ON public.uba_persistence;
DROP POLICY IF EXISTS "Network registry discovery" ON public.uba_persistence;
DROP POLICY IF EXISTS "Manage Own Data" ON public.uba_persistence;
DROP POLICY IF EXISTS "Public Read Registry" ON public.uba_persistence;

-- POLICY 1: Allow anyone to INSERT
-- This is necessary for the onboarding flow where a user is created and immediately 
-- pushes their first institutional data shard.
CREATE POLICY "Enable initial registration" ON public.uba_persistence
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- POLICY 2: Public Institutional Discovery
-- Allows the login portal to verify a Hub ID exists before attempting authentication.
CREATE POLICY "Public registry discovery" ON public.uba_persistence
FOR SELECT TO anon, authenticated
USING (id LIKE 'registry_%');

-- POLICY 3: Authenticated owners can manage their own data
-- This covers SELECT, UPDATE, and DELETE for institutional shards.
CREATE POLICY "Owners manage own data" ON public.uba_persistence
FOR ALL TO authenticated
USING (auth.uid() = user_id OR user_id IS NULL)
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 3. INDEXING FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_uba_persistence_user_id ON public.uba_persistence(user_id);
CREATE INDEX IF NOT EXISTS idx_uba_persistence_registry ON public.uba_persistence(id) WHERE id LIKE 'registry_%';

-- 4. REAL-TIME ENABLEMENT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'uba_persistence'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.uba_persistence;
  END IF;
END $$;