import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

type DB = SupabaseClient;

export async function listCheckinEvents(supabase: DB) {
  const { data, error } = await supabase
    .from("events")
    .select("id, name, slug, event_date, event_time, location, capacity, status")
    .in("status", ["OPEN", "CLOSED"])
    .order("event_date", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getEventCheckinStats(supabase: DB, eventId: string) {
  const [{ count: checkedIn }, { data: approvedOrders }] = await Promise.all([
    supabase.from("checkins").select("id", { count: "exact", head: true }).eq("event_id", eventId),
    supabase.from("orders").select("quantity").eq("event_id", eventId).eq("payment_status", "APPROVED"),
  ]);

  const approvedTickets = (approvedOrders ?? []).reduce((sum, o) => sum + o.quantity, 0);

  return {
    checkedIn: checkedIn ?? 0,
    approvedTickets,
  };
}

export async function findTicketByToken(supabase: DB, eventId: string, token: string) {
  const { data, error } = await supabase
    .from("tickets")
    .select("*, orders(order_number, user_id)")
    .eq("event_id", eventId)
    .eq("token", token)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function searchTicketsForCheckin(supabase: DB, eventId: string, query: string) {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  // Small dataset per event (tens to a few hundred tickets) — fetch and
  // filter in memory rather than fighting Postgrest's join-filter syntax.
  const { data, error } = await supabase
    .from("tickets")
    .select("*, orders!inner(order_number, user_id, profiles:profiles!orders_user_id_profiles_fkey(full_name, email))")
    .eq("event_id", eventId)
    .limit(1000);

  if (error) throw error;

  return (data ?? [])
    .filter((t) => {
      const order = t.orders as unknown as {
        order_number: string;
        profiles: { full_name: string; email: string } | null;
      };
      const haystack = [
        t.ticket_number,
        order.order_number,
        order.profiles?.full_name ?? "",
        order.profiles?.email ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(trimmed);
    })
    .slice(0, 25);
}

export async function listCheckinHistory(supabase: DB, eventId?: string) {
  let query = supabase
    .from("checkins")
    .select("*, tickets(ticket_number, orders(order_number, profiles:profiles!orders_user_id_profiles_fkey(full_name)))")
    .order("checked_in_at", { ascending: false })
    .limit(200);

  if (eventId) query = query.eq("event_id", eventId);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
