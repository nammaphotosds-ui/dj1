import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Replace with your Supabase project URL and anon key.
// You can find these in your Supabase project's API settings.
const supabaseUrl = 'https://xujwwpzwcvdofbkuroon.supabase.co';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

if (!supabaseUrl || supabaseUrl === 'https://xujwwpzwcvdofbkuroon.supabase.co') {
  console.error("Supabase URL is not configured. Please add it to utils/supabase.ts");
}

if (!supabaseAnonKey || supabaseAnonKey === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1and3cHp3Y3Zkb2Zia3Vyb29uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NzQ2MzQsImV4cCI6MjA3NTA1MDYzNH0.ZuUMlUkHqcdl7eGFUIbrBYF8gDCRX_anuG7gLio98eM') {
    console.error("Supabase anon key is not configured. Please add it to utils/supabase.ts");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
