import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

type DB = SupabaseClient;

export interface EventIndicators {
  capacity: number;
  requestedTickets: number;
  pendingPayments: number;
  approvedPayments: number;
  ticketsIssued: number;
  checkins: number;
  remainingSeats: number;
  confirmedRevenue: number;
  attendanceRate: number;
  onlineOrders: number;
  walkInOrders: number;
}

export async function getEventIndicators(supabase: DB, eventId: string): Promise<EventIndicators> {
  const [eventRes, ordersRes, ticketsRes, checkinsRes] = await Promise.all([
    supabase.from("events").select("capacity").eq("id", eventId).single(),
    supabase.from("orders").select("quantity, total_amount, payment_status, sale_channel").eq("event_id", eventId),
    supabase.from("tickets").select("id", { count: "exact", head: true }).eq("event_id", eventId),
    supabase.from("checkins").select("id", { count: "exact", head: true }).eq("event_id", eventId),
  ]);

  const capacity = eventRes.data?.capacity ?? 0;
  const orders = ordersRes.data ?? [];

  const requestedTickets = orders.reduce((sum, o) => sum + o.quantity, 0);
  const pendingPayments = orders.filter((o) => o.payment_status === "PENDING").reduce((s, o) => s + o.quantity, 0);
  const approvedOrders = orders.filter((o) => o.payment_status === "APPROVED");
  const approvedPayments = approvedOrders.reduce((s, o) => s + o.quantity, 0);
  const confirmedRevenue = approvedOrders.reduce((s, o) => s + Number(o.total_amount), 0);
  const ticketsIssued = ticketsRes.count ?? 0;
  const checkins = checkinsRes.count ?? 0;
  const onlineOrders = approvedOrders.filter((o) => o.sale_channel !== "WALK_IN").length;
  const walkInOrders = approvedOrders.filter((o) => o.sale_channel === "WALK_IN").length;

  return {
    capacity,
    requestedTickets,
    pendingPayments,
    approvedPayments,
    ticketsIssued,
    checkins,
    remainingSeats: Math.max(0, capacity - approvedPayments),
    confirmedRevenue,
    attendanceRate: ticketsIssued > 0 ? Math.round((checkins / ticketsIssued) * 100) : 0,
    onlineOrders,
    walkInOrders,
  };
}

export async function getGlobalIndicators(supabase: DB) {
  const [usersRes, ordersRes, ticketsRes, checkinsRes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("total_amount, payment_status"),
    supabase.from("tickets").select("id", { count: "exact", head: true }),
    supabase.from("checkins").select("id", { count: "exact", head: true }),
  ]);

  const orders = ordersRes.data ?? [];
  const approved = orders.filter((o) => o.payment_status === "APPROVED");
  const pending = orders.filter((o) => o.payment_status === "PENDING");

  return {
    totalUsers: usersRes.count ?? 0,
    totalOrders: orders.length,
    totalTickets: ticketsRes.count ?? 0,
    approvedPayments: approved.length,
    pendingPayments: pending.length,
    confirmedRevenue: approved.reduce((s, o) => s + Number(o.total_amount), 0),
    checkins: checkinsRes.count ?? 0,
  };
}

export async function listRecentOrders(supabase: DB, limit = 8) {
  const { data } = await supabase
    .from("orders")
    .select("id, order_number, quantity, total_amount, payment_status, created_at, events(name), profiles!orders_user_id_profiles_fkey(full_name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}
