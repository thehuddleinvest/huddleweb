import { createClient } from "@supabase/supabase-js";

// Service-role Supabase client. SERVER-ONLY. Bypasses RLS — never import this
// into a client component or expose the service_role key to the browser.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
