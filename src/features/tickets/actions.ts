"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { sendTicketsIssuedEmail } from "@/emails/send";
import type { ActionResult } from "@/features/auth/actions";

export async function cancelTicketAction(ticketId: string): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");
  const supabase = await createClient();

  const { error } = await supabase.rpc("cancel_ticket", {
    p_ticket_id: ticketId,
    p_admin_id: admin.id,
  });

  if (error) {
    if (error.message.includes("TICKET_NOT_CANCELLABLE")) {
      return { ok: false, error: "Somente ingressos disponíveis podem ser cancelados" };
    }
    return { ok: false, error: "Não foi possível cancelar o ingresso" };
  }

  revalidatePath("/admin/ingressos");
  return { ok: true };
}

export async function resendTicketEmailAction(orderId: string): Promise<ActionResult> {
  await requireRole("ADMIN");

  try {
    await sendTicketsIssuedEmail(orderId);
    return { ok: true };
  } catch (err) {
    console.error("Failed to resend tickets-issued email for order", orderId, err);
    const detail = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Não foi possível reenviar o e-mail (${detail})` };
  }
}
