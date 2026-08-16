import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TicketRow } from "@/types/database";

type DB = SupabaseClient;

export interface TicketWithEvent extends TicketRow {
  events: { name: string; slug: string; event_date: string; event_time: string; location: string } | null;
  orders: { order_number: string } | null;
}

export async function listTicketsForUser(supabase: DB, userId: string): Promise<TicketWithEvent[]> {
  const { data, error } = await supabase
    .from("tickets")
    .select("*, events(name, slug, event_date, event_time, location), orders!inner(order_number, user_id)")
    .eq("orders.user_id", userId)
    .order("ticket_number", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as TicketWithEvent[];
}

export async function listTicketsForOrder(supabase: DB, orderId: string): Promise<TicketRow[]> {
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("order_id", orderId)
    .order("ticket_number", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getTicketByToken(supabase: DB, token: string) {
  const { data, error } = await supabase
    .from("tickets")
    .select("*, events(name, event_date, event_time, location)")
    .eq("token", token)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listAllTickets(supabase: DB, eventId?: string) {
  let query = supabase
    .from("tickets")
    .select("*, events(name), orders(order_number, user_id)")
    .order("created_at", { ascending: false });

  if (eventId) query = query.eq("event_id", eventId);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
