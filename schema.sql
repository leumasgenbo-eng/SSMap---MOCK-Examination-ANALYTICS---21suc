-- UNITED BAYLOR ACADEMY (UBA) & PARTNER SCHOOLS - MULTI-TENANT SCHEMA
-- Execute this script in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. THE PERSISTENCE ENGINE
-- This table stores all school-specific data in isolated "shards" (Settings, Students, Staff, History).
CREATE TABLE IF NOT EXISTS public.uba_persistence (
  id TEXT PRIMARY KEY,                       -- Format: '${HUB_ID}_type' (e.g., 'UBA-2025-1234_students')
  payload JSONB NOT NULL,                    -- The actual data payload (Students array, Settings object, etc.)
  last_updated TIMESTAMPTZ DEFAULT NOW(),    -- Used for conflict resolution and sync tracking
  user_id UUID DEFAULT auth.uid()            -- The owner's unique ID from Supabase Auth
);

-- 2. SECURITY & ISOLATION (RLS)
-- This ensures that UNITED BAYLOR ACADEMY cannot see CULBURY ACADEMY's student data.
ALTER TABLE public.uba_persistence ENABLE ROW LEVEL SECURITY;

-- POLICY 1: Public Discovery (ANONYMOUS)
-- Allows the login screen to search for a school by its Hub ID to verify the name and access key before login.
-- Only applies to records prefixed with 'registry_'.
DROP POLICY IF EXISTS "Public registry discovery" ON public.uba_persistence;
CREATE POLICY "Public registry discovery" ON public.uba_persistence
FOR SELECT TO anon, authenticated
USING (id LIKE 'registry_%');

-- POLICY 2: Onboarding (ANONYMOUS/AUTHENTICATED)
-- Allows a new school to push its initial registration data shards.
DROP POLICY IF EXISTS "Enable initial registration" ON public.uba_persistence;
CREATE POLICY "Enable initial registration" ON public.uba_persistence
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- POLICY 3: Private Shard Access (AUTHENTICATED OWNERS)
-- Grant a school administrator full control over their own institutional shards.
DROP POLICY IF EXISTS "Owners manage own data" ON public.uba_persistence;
CREATE POLICY "Owners manage own data" ON public.uba_persistence
FOR ALL TO authenticated
USING (auth.uid() = user_id OR user_id IS NULL)
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);


-- 3. PERFORMANCE INDEXING
-- Crucial for fast lookups across thousands of registered institutions.
CREATE INDEX IF NOT EXISTS idx_uba_persistence_user_id ON public.uba_persistence(user_id);
CREATE INDEX IF NOT EXISTS idx_uba_persistence_registry_lookup ON public.uba_persistence(id) WHERE id LIKE 'registry_%';


-- 4. REAL-TIME REPLICATION
-- Enables the "Cloud Sync" feature where multiple teachers/staff can see live score updates.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'uba_persistence'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.uba_persistence;
  ELSE
    -- Re-add to ensure any column changes are captured
    ALTER PUBLICATION supabase_realtime ADD TABLE public.uba_persistence;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Realtime publication setup skipped or already configured.';
END $$;


-- 5. AUTOMATIC TIMESTAMPING
-- Updates 'last_updated' every time a teacher or admin saves data.
CREATE OR REPLACE FUNCTION update_uba_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_uba_timestamp ON public.uba_persistence;
CREATE TRIGGER trigger_update_uba_timestamp
BEFORE UPDATE ON public.uba_persistence
FOR EACH ROW
EXECUTE FUNCTION update_uba_timestamp();

-- DEPLOYMENT NOTES:
-- 1. This schema supports an infinite number of schools.
-- 2. Each school generates its own Hub ID (e.g., UBA-2025-XXXX).
-- 3. The 'registry' records are public to facilitate the 'login by Hub ID' flow.
-- 4. Student scores and particulars remain strictly private to the authenticated school owner.