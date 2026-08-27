import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventRow } from "@/types/database";
import { createAdminClient } from "@/lib/supabase/admin";

type DB = SupabaseClient;

export async function listPublicEvents(supabase: DB): Promise<EventRow[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .in("status", ["OPEN", "CLOSED"])
    .order("event_date", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function listAllEvents(supabase: DB): Promise<EventRow[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getEventBySlug(supabase: DB, slug: string): Promise<EventRow | null> {
  const { data, error } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getEventById(supabase: DB, id: string): Promise<EventRow | null> {
  const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Sum of ticket quantities from APPROVED orders — the seats actually reserved.
 * Uses the admin client because this powers public availability counts, and
 * the `orders` RLS policy only lets a user see their own orders (or staff see
 * all), which would silently return 0 rows for anonymous/customer visitors.
 */
export async function getApprovedTicketQuantity(_supabase: DB, eventId: string): Promise<number> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select("quantity")
    .eq("event_id", eventId)
    .eq("payment_status", "APPROVED");

  if (error) throw error;
  return (data ?? []).reduce((sum, o: { quantity: number }) => sum + o.quantity, 0);
}

export async function createEvent(supabase: DB, input: Partial<EventRow>): Promise<EventRow> {
  const { data, error } = await supabase.from("events").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateEvent(
  supabase: DB,
  id: string,
  input: Partial<EventRow>
): Promise<EventRow> {
  const { data, error } = await supabase
    .from("events")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
