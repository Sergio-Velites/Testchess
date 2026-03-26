/**
 * Supabase client singleton
 * Replace SUPABASE_URL and SUPABASE_ANON_KEY with your project values.
 * These are public/safe to expose in the browser.
 */
const SUPABASE_URL      = window.ENV_SUPABASE_URL      || 'https://bouwyielngvqltusosle.supabase.co';
const SUPABASE_ANON_KEY = window.ENV_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvdXd5aWVsbmd2cWx0dXNvc2xlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NDQ0NjAsImV4cCI6MjA5MDEyMDQ2MH0.hnL8Q2d4l7ZZ6VNCcX_p18fg0KMX-VYi-2hulckymO0';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default sb;
