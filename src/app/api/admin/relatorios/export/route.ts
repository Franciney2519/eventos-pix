import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { toCsv } from "@/features/reports/csv";

const REPORTS = ["orders", "payments", "tickets", "checkins"] as const;
type ReportType = (typeof REPORTS)[number];

export async function GET(request: Request) {
  await requireRole("ADMIN");

  const url = new URL(request.url);
  const type = url.searchParams.get("type") as ReportType | null;
  const eventId = url.searchParams.get("eventId") ?? undefined;

  if (!type || !REPORTS.includes(type)) {
    return NextResponse.json({ ok: false, error: "Tipo de relatório inválido" }, { status: 400 });
  }

  const supabase = await createClient();
  const csv = await buildReport(supabase, type, eventId);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${type}.csv"`,
    },
  });
}

async function buildReport(
  supabase: Awaited<ReturnType<typeof createClient>>,
  type: ReportType,
  eventId?: string
) {
  if (type === "orders") {
    let query = supabase
      .from("orders")
      .select("order_number, quantity, total_amount, payment_status, order_status, created_at, events(name), profiles!orders_user_id_profiles_fkey(full_name, email)")
      .order("created_at", { ascending: false });
    if (eventId) query = query.eq("event_id", eventId);
    const { data } = await query;
    return toCsv(
      (data ?? []).map((o) => ({
        pedido: o.order_number,
        evento: (o.events as unknown as { name: string } | null)?.name ?? "",
        comprador: (o.profiles as unknown as { full_name: string } | null)?.full_name ?? "",
        email: (o.profiles as unknown as { email: string } | null)?.email ?? "",
        quantidade: o.quantity,
        total: o.total_amount,
        status_pagamento: o.payment_status,
        status_pedido: o.order_status,
        criado_em: o.created_at,
      }))
    );
  }

  if (type === "payments") {
    let query = supabase
      .from("payment_proofs")
      .select("file_name, review_status, uploaded_at, reviewed_at, observation, orders(order_number, total_amount, event_id)")
      .order("uploaded_at", { ascending: false });
    const { data } = await query;
    const rows = (data ?? []).filter((p) => {
      if (!eventId) return true;
      return (p.orders as unknown as { event_id: string } | null)?.event_id === eventId;
    });
    return toCsv(
      rows.map((p) => ({
        pedido: (p.orders as unknown as { order_number: string } | null)?.order_number ?? "",
        arquivo: p.file_name,
        status: p.review_status,
        enviado_em: p.uploaded_at,
        analisado_em: p.reviewed_at ?? "",
        observacao: p.observation ?? "",
      }))
    );
  }

  if (type === "tickets") {
    let query = supabase
      .from("tickets")
      .select("ticket_number, status, issued_at, used_at, orders(order_number, profiles!orders_user_id_profiles_fkey(full_name, email))")
      .order("ticket_number", { ascending: true });
    if (eventId) query = query.eq("event_id", eventId);
    const { data } = await query;
    return toCsv(
      (data ?? []).map((t) => ({
        ingresso: t.ticket_number,
        status: t.status,
        pedido: (t.orders as unknown as { order_number: string } | null)?.order_number ?? "",
        comprador: (t.orders as unknown as { profiles: { full_name: string } | null } | null)?.profiles?.full_name ?? "",
        email: (t.orders as unknown as { profiles: { email: string } | null } | null)?.profiles?.email ?? "",
        emitido_em: t.issued_at,
        utilizado_em: t.used_at ?? "",
      }))
    );
  }

  // checkins
  let query = supabase
    .from("checkins")
    .select("checked_in_at, source, tickets(ticket_number, orders(order_number, profiles!orders_user_id_profiles_fkey(full_name)))")
    .order("checked_in_at", { ascending: false });
  if (eventId) query = query.eq("event_id", eventId);
  const { data } = await query;
  return toCsv(
    (data ?? []).map((c) => ({
      horario: c.checked_in_at,
      ingresso: (c.tickets as unknown as { ticket_number: string } | null)?.ticket_number ?? "",
      participante:
        (c.tickets as unknown as { orders: { profiles: { full_name: string } | null } | null } | null)?.orders
          ?.profiles?.full_name ?? "",
      pedido:
        (c.tickets as unknown as { orders: { order_number: string } | null } | null)?.orders?.order_number ?? "",
      tipo: c.source,
    }))
  );
}
