// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://mdxhnkcfyslqwgmywpjf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1keGhua2NmeXNscXdnbXl3cGpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NDk5NjYsImV4cCI6MjA2MjAyNTk2Nn0.RW_4nQmvymbwFp0f7WA59ZeNDic65y705TYXohNHFNk";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});