import { createClient } from '@supabase/supabase-js';

// The user-provided Supabase endpoint
const supabaseUrl = 'https://zokbowglwohpfqmjnemc.supabase.co';

// The Supabase Anon Key provided by the user
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva2Jvd2dsd29ocGZxbWpuZW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NzAyOTEsImV4cCI6MjA4NDU0NjI5MX0.FA-TC3fnHAipudO8X-jJ7iljkwxn9L_g-tuXd8x4_Yo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * ARCHITECTURAL REQUIREMENTS:
 * The 'uba_persistence' table must exist in the Supabase project.
 * 
 * SQL CONFIGURATION (Run in Supabase SQL Editor):
 * 
 * -- 1) Create table if missing
 * CREATE TABLE IF NOT EXISTS public.uba_persistence (
 *   id TEXT PRIMARY KEY,
 *   payload JSONB NOT NULL,
 *   last_updated TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * -- 2) Add user_id column if missing
 * ALTER TABLE public.uba_persistence
 *   ADD COLUMN IF NOT EXISTS user_id uuid;
 * 
 * -- 3) Index for policy performance
 * CREATE INDEX IF NOT EXISTS idx_uba_persistence_user_id ON public.uba_persistence(user_id);
 * 
 * -- 4) Ensure RLS is enabled
 * ALTER TABLE public.uba_persistence ENABLE ROW LEVEL SECURITY;
 * 
 * -- 5) Remove any permissive public policy named "Allow public access" (if it exists)
 * -- EXECUTE format('DROP POLICY "%s" ON public.uba_persistence', 'Allow public access');
 * 
 * -- 6) Create owner-based policies for authenticated users
 * -- Note: Ensure the "Allow public access" policy is replaced with specific authenticated ones.
 */