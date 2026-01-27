import { createClient } from '@supabase/supabase-js';

// Safe environment variable access to prevent "Cannot read properties of undefined"
const getEnvVar = (name: string, fallback: string): string => {
  try {
    // Try Vite standard
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[name]) {
      return import.meta.env[name];
    }
    // Try Node/CommonJS standard (often shimmed in web containers)
    if (typeof process !== 'undefined' && process.env && process.env[name]) {
      return process.env[name];
    }
  } catch (e) {
    console.warn(`Environment variable access failed for ${name}:`, e);
  }
  return fallback;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', 'https://atlhesebcfjcecmbmwuj.supabase.co');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0bGhlc2ViY2ZqY2VjbWJtd3VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDc0MTYsImV4cCI6MjA4NTAyMzQxNn0.hmiF7aWatQCGaJPuc2LzzF7z2IAxwoBy3fGlNacz2XQ');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * FINALIZED SCHEMA (Execute in Supabase SQL Editor):
 * 
 * -- Table Setup
 * CREATE TABLE public.uba_persistence (
 *   id TEXT PRIMARY KEY,
 *   payload JSONB NOT NULL,
 *   last_updated TIMESTAMPTZ DEFAULT NOW(),
 *   user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE
 * );
 * 
 * -- Security
 * ALTER TABLE public.uba_persistence ENABLE ROW LEVEL SECURITY;
 * 
 * -- Owners manage their own rows
 * CREATE POLICY "Manage Own Data" ON public.uba_persistence
 * FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
 * 
 * -- Allow registry discovery (PUBLIC / ANON)
 * -- This is CRITICAL: unauthenticated users must see the registry to log in.
 * CREATE POLICY "Public Read Registry" ON public.uba_persistence
 * FOR SELECT TO anon, authenticated USING (id LIKE 'registry_%');
 */