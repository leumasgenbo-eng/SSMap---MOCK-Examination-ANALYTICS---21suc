import { createClient } from '@supabase/supabase-js';

// The user-provided Supabase endpoint
const supabaseUrl = 'https://zokbowglwohpfqmjnemc.supabase.co';

// The Supabase Anon Key provided by the user
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva2Jvd2dsd29ocGZxbWpuZW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NzAyOTEsImV4cCI6MjA4NDU0NjI5MX0.FA-TC3fnHAipudO8X-jJ7iljkwxn9L_g-tuXd8x4_Yo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * ARCHITECTURAL REQUIREMENTS:
 * The 'uba_persistence' table must exist in the Supabase project with:
 * - id (TEXT PRIMARY KEY)
 * - payload (JSONB)
 * - last_updated (TIMESTAMPTZ)
 */
