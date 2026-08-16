import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { findTicketByToken } from "@/features/checkin/repository";
import { evaluateTicketForCheckin } from "@/lib/checkin/rules";

const bodySchema = z.object({
  token: z.string().min(10),
  eventId: z.string().uuid(),
});

export async function POST(request: Request) {
  await requireRole("ADMIN", "CHECKIN");

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Requisição inválida" }, { status: 400 });
  }

  const supabase = await createClient();
  const ticket = await findTicketByToken(supabase, parsed.data.eventId, parsed.data.token);
  const outcome = evaluateTicketForCheckin(ticket?.status ?? null);

  if (outcome === "TICKET_NOT_FOUND" || !ticket) {
    return NextResponse.json({ ok: true, outcome: "TICKET_NOT_FOUND" });
  }

  return NextResponse.json({
    ok: true,
    outcome,
    ticket: {
      id: ticket.id,
      ticketNumber: ticket.ticket_number,
      status: ticket.status,
      usedAt: ticket.used_at,
      orderNumber: (ticket as unknown as { orders: { order_number: string } | null }).orders?.order_number ?? null,
    },
  });
}
