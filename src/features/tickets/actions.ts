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
  } catch {
    return { ok: false, error: "Não foi possível reenviar o e-mail" };
  }
}

/**
 * Marks badges as printed (or reprinted — always overwrites with "now",
 * reprinting is never blocked). Called right before the browser print
 * dialog opens, from /imprimir/crachas.
 */
export async function markBadgesPrintedAction(ticketIds: string[]): Promise<ActionResult> {
  await requireRole("ADMIN");
  if (ticketIds.length === 0) return { ok: true };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tickets")
    .update({ badge_printed_at: new Date().toISOString() })
    .in("id", ticketIds);

  if (error) return { ok: false, error: "Não foi possível registrar a impressão" };

  revalidatePath("/admin/ingressos");
  return { ok: true };
}
