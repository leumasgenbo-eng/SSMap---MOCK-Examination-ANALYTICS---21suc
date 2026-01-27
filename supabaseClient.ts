import { createClient } from '@supabase/supabase-js';

/**
 * UNITED BAYLOR ACADEMY - PERSISTENCE LAYER CONFIGURATION
 * ------------------------------------------------------
 * This client manages the handshake between the frontend and the 
 * Supabase PostgreSQL engine using Multi-Tenant RLS policies.
 */

const getSafeEnv = (key: string, fallback: string): string => {
  try {
    // 1. Try Vite-style env (standard for this project)
    // Fix: Accessing import.meta via type casting to any to avoid property 'env' existence errors in TypeScript
    const anyMeta = import.meta as any;
    if (anyMeta && anyMeta.env && anyMeta.env[key]) {
      return anyMeta.env[key];
    }
    // 2. Try Process-style env (standard for Node/CI)
    // Fix: Casting process.env to any to ensure safe property access if global definitions are missing
    const anyProcessEnv = (typeof process !== 'undefined' && process.env) ? (process.env as any) : null;
    if (anyProcessEnv && anyProcessEnv[key]) {
      return anyProcessEnv[key];
    }
  } catch (e) {
    // Silent fail - use fallback
  }
  return fallback;
};

const supabaseUrl = getSafeEnv('VITE_SUPABASE_URL', 'https://atlhesebcfjcecmbmwuj.supabase.co');
const supabaseAnonKey = getSafeEnv('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0bGhlc2ViY2ZqY2VjbWJtd3VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDc0MTYsImV4cCI6MjA4NTAyMzQxNn0.hmiF7aWatQCGaJPuc2LzzF7z2IAxwoBy3fGlNacz2XQ');

// Initialize the Singleton Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * HANDSHAKE VERIFICATION:
 * To ensure the database is ready, run the provided schema.sql in your 
 * Supabase SQL Editor. The table name must be: uba_persistence
 */
