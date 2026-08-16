import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrderRow, PaymentProofRow } from "@/types/database";

type DB = SupabaseClient;

export interface OrderWithEvent extends OrderRow {
  events: { name: string; slug: string; event_date: string; event_time: string; location: string } | null;
}

export async function listOrdersForUser(supabase: DB, userId: string): Promise<OrderWithEvent[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, events(name, slug, event_date, event_time, location)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as OrderWithEvent[];
}

export async function getOrderById(supabase: DB, id: string): Promise<OrderWithEvent | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, events(name, slug, event_date, event_time, location)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as OrderWithEvent | null;
}

export async function listAllOrders(
  supabase: DB,
  filter?: { paymentStatus?: string; search?: string }
) {
  let query = supabase
    .from("orders")
    .select("*, events(name, slug), profiles!orders_user_id_profiles_fkey(full_name, email)")
    .order("created_at", { ascending: false });

  if (filter?.paymentStatus) {
    query = query.eq("payment_status", filter.paymentStatus);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createOrder(
  supabase: DB,
  input: {
    order_number: string;
    user_id: string;
    event_id: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
  }
): Promise<OrderRow> {
  const { data, error } = await supabase.from("orders").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function generateOrderNumber(supabase: DB): Promise<string> {
  const { data, error } = await supabase.rpc("generate_order_number");
  if (error) throw error;
  return data as string;
}

export async function createPaymentProof(
  supabase: DB,
  input: {
    order_id: string;
    file_path: string;
    file_name: string;
    mime_type: string;
    file_size: number;
  }
): Promise<PaymentProofRow> {
  const { data, error } = await supabase.from("payment_proofs").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function getProofsForOrder(supabase: DB, orderId: string): Promise<PaymentProofRow[]> {
  const { data, error } = await supabase
    .from("payment_proofs")
    .select("*")
    .eq("order_id", orderId)
    .order("uploaded_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
