import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { searchTicketsForCheckin } from "@/features/checkin/repository";

export async function GET(request: Request) {
  await requireRole("ADMIN", "CHECKIN");

  const url = new URL(request.url);
  const eventId = url.searchParams.get("eventId");
  const q = url.searchParams.get("q") ?? "";

  if (!eventId) {
    return NextResponse.json({ ok: false, error: "eventId é obrigatório" }, { status: 400 });
  }

  const supabase = await createClient();
  const tickets = await searchTicketsForCheckin(supabase, eventId, q);

  return NextResponse.json({
    ok: true,
    results: tickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticket_number,
      status: t.status,
      orderNumber: (t.orders as unknown as { order_number: string }).order_number,
      participantName: (t.orders as unknown as { profiles: { full_name: string } | null }).profiles?.full_name ?? "",
      alreadyCheckedInToday: t.alreadyCheckedInToday,
    })),
  });
}
