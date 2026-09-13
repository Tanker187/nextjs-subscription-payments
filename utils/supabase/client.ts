import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types_db';

// Create a Supabase client for browser/client-side operations.
export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
