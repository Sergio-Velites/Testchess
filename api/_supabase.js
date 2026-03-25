/**
 * Shared Supabase admin client for API routes.
 * Uses the SERVICE ROLE key (server-side only — never expose to the browser).
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL          = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

module.exports = sb;
