import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmailLogRow } from "@/types/database";

type DB = SupabaseClient;

export interface EmailLogWithOrder extends EmailLogRow {
  orders: { order_number: string } | null;
}

export async function listEmailLogs(
  supabase: DB,
  filter?: { status?: string }
): Promise<EmailLogWithOrder[]> {
  let query = supabase
    .from("email_logs")
    .select("*, orders(order_number)")
    .order("sent_at", { ascending: false })
    .limit(200);

  if (filter?.status) {
    query = query.eq("status", filter.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as EmailLogWithOrder[];
}
