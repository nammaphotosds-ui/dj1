import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xujwwpzwcvdofbkuroon.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1and3cHp3Y3Zkb2Zia3Vyb29uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NzQ2MzQsImV4cCI6MjA3NTA1MDYzNH0.ZuUMlUkHqcdl7eGFUIbrBYF8gDCRX_anuG7gLio98eM';

if (!supabaseUrl) {
  throw new Error("Supabase URL is not configured.");
}

if (!supabaseAnonKey) {
    throw new Error("Supabase anon key is not configured.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
