/**
 * PulseWave QA Platform — Supabase Client Configuration
 * Real Authentication & Cloud Database Engine
 */

const SUPABASE_URL = 'https://wbtvsishoufterznmfot.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndidHZzaXNob3VmdGVyem5tZm90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5MDE2ODYsImV4cCI6MjEwMzQ3NzY4Nn0.oSQHzLgiaZqI3FzsbDpo02r3ukjvHfVc9s1x_SkQBHM';

let supabaseClient = null;

try {
  if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'pulsewave_supabase_auth_token'
      }
    });
  }
} catch (err) {
  console.error('Failed to initialize Supabase client:', err);
}

// Global accessor
window.supabaseClient = supabaseClient;
window.SUPABASE_CONFIG = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY
};
