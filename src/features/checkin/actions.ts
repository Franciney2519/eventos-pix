"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/session";
import { sendTicketsIssuedEmail } from "@/emails/send";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { ticketPublicUrl } from "@/lib/tickets/token";

const walkInSaleSchema = z.object({
  eventId: z.string().uuid(),
  fullName: z.string().trim().min(3, "Informe o nome completo"),
  email: z.string().trim().email("E-mail inválido"),
  phone: z.string().trim().min(10, "Informe um WhatsApp válido com DDD"),
  paymentMethod: z.enum(["PIX", "CASH"]),
});

export interface WalkInSaleResult {
  ok: boolean;
  error?: string;
  ticketNumber?: string;
  ticketUrl?: string;
  whatsappLink?: string | null;
}

export async function createWalkInSaleAction(formData: FormData): Promise<WalkInSaleResult> {
  const operator = await requireRole("ADMIN", "CHECKIN");

  const parsed = walkInSaleSchema.safeParse({
    eventId: formData.get("eventId"),
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    paymentMethod: formData.get("paymentMethod"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { eventId, fullName, email, phone, paymentMethod } = parsed.data;
  const admin = createAdminClient();

  // Reuse an existing account for this email if there is one, otherwise
  // create a lightweight CUSTOMER account — the buyer never needs a
  // password to receive/view their ticket (email + wa.me link cover it),
  // but /esqueci-senha lets them set one later if they want to log in.
  const { data: existingUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
  let buyerUserId = existingUsers?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id;

  if (!buyerUserId) {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: crypto.randomUUID(),
      email_confirm: true,
      user_metadata: { full_name: fullName, phone },
    });
    if (createError || !created.user) {
      return { ok: false, error: "Não foi possível registrar o comprador" };
    }
    buyerUserId = created.user.id;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_walk_in_sale", {
    p_event_id: eventId,
    p_buyer_user_id: buyerUserId,
    p_operator_id: operator.id,
    p_payment_method: paymentMethod,
    p_attendee_name: fullName,
  });

  if (error) {
    if (error.message.includes("INSUFFICIENT_CAPACITY")) {
      return { ok: false, error: "Não há mais vagas disponíveis para este evento" };
    }
    return { ok: false, error: "Não foi possível registrar a venda" };
  }

  const result = Array.isArray(data) ? data[0] : data;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const ticketUrl = ticketPublicUrl(appUrl, result.out_token);

  try {
    await sendTicketsIssuedEmail(result.out_order_id);
  } catch {
    // best-effort — the ticket link below still gets the buyer in
  }

  const whatsappLink = buildWhatsAppLink(
    phone,
    `Olá, ${fullName}! Aqui está seu ingresso: ${ticketUrl}`
  );

  return {
    ok: true,
    ticketNumber: result.out_ticket_number,
    ticketUrl,
    whatsappLink,
  };
}
