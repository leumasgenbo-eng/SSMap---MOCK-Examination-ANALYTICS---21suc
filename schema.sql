-- UNITED BAYLOR ACADEMY (UBA) - DATABASE SCHEMA (REFINED)
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

-- Drop existing policies to avoid conflicts during update
DROP POLICY IF EXISTS "Institutions manage own data" ON public.uba_persistence;
DROP POLICY IF EXISTS "Network registry discovery" ON public.uba_persistence;
DROP POLICY IF EXISTS "Manage Own Data" ON public.uba_persistence;
DROP POLICY IF EXISTS "Public Read Registry" ON public.uba_persistence;

-- POLICY 1: Allow public/unauthenticated INSERT
-- Required for the SchoolRegistrationPortal to create initial records during the signUp flow
-- Upserting a NEW record only requires INSERT permission.
CREATE POLICY "Enable initial registration" ON public.uba_persistence
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- POLICY 2: Allow anyone (Public/Anon) to view the network registry
-- Required for the LoginPortal to verify Hub IDs and Access Keys before sign-in
CREATE POLICY "Public registry discovery" ON public.uba_persistence
FOR SELECT TO anon, authenticated
USING (id LIKE 'registry_%');

-- POLICY 3: Authenticated owners can manage their own data fully
-- This covers SELECT, UPDATE, and DELETE for institutional shards (settings, students, etc.)
CREATE POLICY "Owners manage own data" ON public.uba_persistence
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. INDEXING FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_uba_persistence_user_id ON public.uba_persistence(user_id);
CREATE INDEX IF NOT EXISTS idx_uba_persistence_registry ON public.uba_persistence(id) WHERE id LIKE 'registry_%';

-- 4. REAL-TIME ENABLEMENT
-- Ensure the table is added to the 'supabase_realtime' publication for live syncing.
-- Note: This might fail if already added, which is fine.
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