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
    .select("*, events(name), orders(order_number, user_id, profiles!orders_user_id_profiles_fkey(full_name))")
    .order("created_at", { ascending: false });

  if (eventId) query = query.eq("event_id", eventId);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export interface TicketForBadge {
  id: string;
  ticket_number: string;
  token: string;
  status: string;
  participant_name: string;
  event_name: string;
  event_date: string;
  event_time: string;
  event_location: string;
}

export async function getTicketsForBadges(supabase: DB, ticketIds: string[]): Promise<TicketForBadge[]> {
  if (ticketIds.length === 0) return [];

  const { data, error } = await supabase
    .from("tickets")
    .select(
      "id, ticket_number, token, status, events(name, event_date, event_time, location), orders(profiles!orders_user_id_profiles_fkey(full_name))"
    )
    .in("id", ticketIds);

  if (error) throw error;

  return (data ?? []).map((t) => {
    const event = t.events as unknown as { name: string; event_date: string; event_time: string; location: string };
    const participant = (t.orders as unknown as { profiles: { full_name: string } | null })?.profiles;
    return {
      id: t.id,
      ticket_number: t.ticket_number,
      token: t.token,
      status: t.status,
      participant_name: participant?.full_name ?? "-",
      event_name: event.name,
      event_date: event.event_date,
      event_time: event.event_time,
      event_location: event.location,
    };
  });
}
