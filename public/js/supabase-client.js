/**
 * Supabase client singleton
 * Replace SUPABASE_URL and SUPABASE_ANON_KEY with your project values.
 * These are public/safe to expose in the browser.
 */
const SUPABASE_URL      = window.ENV_SUPABASE_URL      || 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = window.ENV_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default sb;
