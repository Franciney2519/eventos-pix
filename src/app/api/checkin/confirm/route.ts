import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";

const bodySchema = z.object({
  ticketId: z.string().uuid(),
  source: z.enum(["QR", "MANUAL"]),
  deviceInfo: z.string().optional(),
});

export async function POST(request: Request) {
  const user = await requireRole("ADMIN", "CHECKIN");

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Requisição inválida" }, { status: 400 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("confirm_checkin", {
    p_ticket_id: parsed.data.ticketId,
    p_operator_id: user.id,
    p_source: parsed.data.source,
    p_device_info: parsed.data.deviceInfo ?? null,
    p_ip_address: ip,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: "Não foi possível confirmar a entrada" }, { status: 500 });
  }

  const result = Array.isArray(data) ? data[0] : data;

  return NextResponse.json({
    ok: true,
    success: result.success,
    message: result.message,
    ticketNumber: result.ticket_number,
    checkedInAt: result.checked_in_at,
  });
}
