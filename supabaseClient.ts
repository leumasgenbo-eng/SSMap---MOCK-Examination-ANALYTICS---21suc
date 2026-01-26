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

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', 'https://zokbowglwohpfqmjnemc.supabase.co');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva2Jvd2dsd29ocGZxbWpuZW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NzAyOTEsImV4cCI6MjA4NDU0NjI5MX0.FA-TC3fnHAipudO8X-jJ7iljkwxn9L_g-tuXd8x4_Yo');

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