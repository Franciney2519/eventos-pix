import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

type DB = SupabaseClient;

export async function listParticipants(supabase: DB) {
  const { data: customers } = await supabase
    .from("profiles")
    .select("id, user_id, full_name, email, phone, created_at")
    .eq("role", "CUSTOMER")
    .order("full_name", { ascending: true });

  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, status, orders(user_id)");

  const ticketCountByUser = new Map<string, { total: number; used: number }>();
  for (const t of tickets ?? []) {
    const userId = (t.orders as unknown as { user_id: string } | null)?.user_id;
    if (!userId) continue;
    const entry = ticketCountByUser.get(userId) ?? { total: 0, used: 0 };
    entry.total += 1;
    if (t.status === "USED") entry.used += 1;
    ticketCountByUser.set(userId, entry);
  }

  return (customers ?? []).map((c) => ({
    ...c,
    ticketsTotal: ticketCountByUser.get(c.user_id)?.total ?? 0,
    ticketsUsed: ticketCountByUser.get(c.user_id)?.used ?? 0,
  }));
}
