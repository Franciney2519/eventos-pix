import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Bypasses RLS entirely — never import this
 * from a Client Component and never send its result to the browser.
 * Restricted to trusted server code: admin actions, seed scripts, email jobs.
 *
 * Untyped on purpose: the hand-written `Database` interface (src/types/database.ts)
 * documents the schema for repositories to cast against, but postgrest-js's
 * literal-string `select()` parser expects the exact shape produced by
 * `supabase gen types typescript` — feeding it a hand-rolled type silently
 * degrades every embedded/select result to `never`. Repositories type their
 * return values explicitly instead (see feature repository.ts files).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase service role configuration");
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
