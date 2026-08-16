import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { findTicketByToken, getLastCheckinForTicket } from "@/features/checkin/repository";
import { evaluateTicketForCheckin } from "@/lib/checkin/rules";
import { isSameManausDay } from "@/lib/checkin/timezone";

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

  if (!ticket) {
    return NextResponse.json({ ok: true, outcome: "TICKET_NOT_FOUND" });
  }

  const lastCheckin = await getLastCheckinForTicket(supabase, ticket.id);
  const alreadyCheckedInToday = lastCheckin ? isSameManausDay(lastCheckin.checked_in_at, new Date().toISOString()) : false;
  const outcome = evaluateTicketForCheckin(ticket.status, alreadyCheckedInToday);

  return NextResponse.json({
    ok: true,
    outcome,
    ticket: {
      id: ticket.id,
      ticketNumber: ticket.ticket_number,
      status: ticket.status,
      lastCheckedInAt: lastCheckin?.checked_in_at ?? null,
      orderNumber: (ticket as unknown as { orders: { order_number: string } | null }).orders?.order_number ?? null,
    },
  });
}
