"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser, requireRole } from "@/lib/auth/session";
import {
  ACCEPTED_PROOF_MIME_TYPES,
  MAX_PROOF_SIZE_BYTES,
  createOrderSchema,
  rejectOrderSchema,
} from "@/lib/validation/schemas";
import { checkOrderCapacity, computeOrderTotal } from "@/lib/orders/rules";
import { getApprovedTicketQuantity, getEventById } from "@/features/events/repository";
import { createOrder, createPaymentProof, generateOrderNumber } from "./repository";
import { sendTicketsIssuedEmail, sendOrderRejectedEmail, sendNewOrderNotificationEmail } from "@/emails/send";
import type { ActionResult } from "@/features/auth/actions";

export interface CreateOrderResult extends ActionResult {
  orderId?: string;
}

export async function createOrderWithProofAction(formData: FormData): Promise<CreateOrderResult> {
  const user = await requireUser();

  let attendeeNames: unknown = [];
  try {
    attendeeNames = JSON.parse(String(formData.get("attendeeNames") ?? "[]"));
  } catch {
    attendeeNames = [];
  }

  const parsed = createOrderSchema.safeParse({
    eventId: formData.get("eventId"),
    quantity: formData.get("quantity"),
    attendeeNames,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const file = formData.get("proof");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Envie o comprovante de pagamento" };
  }
  if (!ACCEPTED_PROOF_MIME_TYPES.includes(file.type)) {
    return { ok: false, error: "Formato de arquivo não aceito. Envie JPG, PNG ou PDF." };
  }
  if (file.size > MAX_PROOF_SIZE_BYTES) {
    return { ok: false, error: "O arquivo excede o limite de 10 MB" };
  }

  const supabase = await createClient();
  const { eventId, quantity, attendeeNames: names } = parsed.data;

  const event = await getEventById(supabase, eventId);
  if (!event) return { ok: false, error: "Evento não encontrado" };

  const approvedQuantity = await getApprovedTicketQuantity(supabase, eventId);
  const capacity = checkOrderCapacity({
    eventStatus: event.status,
    eventCapacity: event.capacity,
    approvedTicketsQuantity: approvedQuantity,
    requestedQuantity: quantity,
    maxTicketsPerOrder: event.max_tickets_per_order,
  });

  if (!capacity.allowed) {
    return { ok: false, error: capacityErrorMessage(capacity.reason, capacity.availableSeats) };
  }

  const orderNumber = await generateOrderNumber(supabase);
  const totalAmount = computeOrderTotal(event.ticket_price, quantity);

  const order = await createOrder(supabase, {
    order_number: orderNumber,
    user_id: user.id,
    event_id: eventId,
    quantity,
    unit_price: event.ticket_price,
    total_amount: totalAmount,
    attendee_names: names,
  });

  const safeName = sanitizeFileName(file.name);
  const filePath = `${user.id}/${order.id}/${Date.now()}-${safeName}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("payment-proofs")
    .upload(filePath, arrayBuffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { ok: false, error: "Não foi possível enviar o comprovante. Tente novamente." };
  }

  await createPaymentProof(supabase, {
    order_id: order.id,
    file_path: filePath,
    file_name: file.name,
    mime_type: file.type,
    file_size: file.size,
  });

  // Best-effort — the order is already saved either way; failures are logged.
  try {
    await sendNewOrderNotificationEmail(order.id);
  } catch (err) {
    // sendAndLog already records failures in email_logs; this logs errors
    // thrown before that point (e.g. missing profile) which are otherwise lost.
    console.error("Failed to send new-order notification email for order", order.id, err);
  }

  revalidatePath("/minhas-inscricoes");
  redirect(`/minhas-inscricoes/${order.id}`);
}

export async function approveOrderAction(orderId: string): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("approve_order", {
    p_order_id: orderId,
    p_admin_id: admin.id,
  });

  if (error) {
    return { ok: false, error: rpcErrorMessage(error.message) };
  }

  const result = Array.isArray(data) ? data[0] : data;
  void result;

  // Best-effort email send — approval already committed, failure is logged.
  try {
    await sendTicketsIssuedEmail(orderId);
  } catch (err) {
    // sendAndLog already records failures in email_logs; this logs errors
    // thrown before that point (e.g. missing profile) which are otherwise lost.
    console.error("Failed to send tickets-issued email for order", orderId, err);
  }

  revalidatePath("/admin/solicitacoes");
  revalidatePath(`/admin/solicitacoes/${orderId}`);
  revalidatePath("/admin/ingressos");
  revalidatePath("/minhas-inscricoes");
  return { ok: true };
}

export async function rejectOrderAction(formData: FormData): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");

  const parsed = rejectOrderSchema.safeParse({
    orderId: formData.get("orderId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Informe o motivo" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("reject_order", {
    p_order_id: parsed.data.orderId,
    p_admin_id: admin.id,
    p_reason: parsed.data.reason,
  });

  if (error) {
    return { ok: false, error: rpcErrorMessage(error.message) };
  }

  try {
    await sendOrderRejectedEmail(parsed.data.orderId);
  } catch (err) {
    console.error("Failed to send order-rejected email for order", parsed.data.orderId, err);
  }

  revalidatePath("/admin/solicitacoes");
  revalidatePath(`/admin/solicitacoes/${parsed.data.orderId}`);
  revalidatePath("/minhas-inscricoes");
  return { ok: true };
}

export async function addProofObservationAction(
  proofId: string,
  observation: string
): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");
  const supabase = await createClient();

  const { error } = await supabase
    .from("payment_proofs")
    .update({ observation, reviewed_by: admin.id })
    .eq("id", proofId);

  if (error) return { ok: false, error: "Não foi possível salvar a observação" };
  return { ok: true };
}

export async function getSignedProofUrl(filePath: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("payment-proofs")
    .createSignedUrl(filePath, 60 * 10); // 10 minutes

  if (error) return null;
  return data.signedUrl;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-100);
}

function capacityErrorMessage(reason: string | undefined, availableSeats: number): string {
  switch (reason) {
    case "EVENT_NOT_OPEN":
      return "As inscrições para este evento não estão abertas";
    case "EXCEEDS_MAX_PER_ORDER":
      return "Quantidade acima do limite permitido por compra";
    case "INSUFFICIENT_CAPACITY":
      return `Apenas ${availableSeats} ingresso(s) disponível(is)`;
    default:
      return "Não foi possível processar sua solicitação";
  }
}

function rpcErrorMessage(message: string): string {
  if (message.includes("INSUFFICIENT_CAPACITY")) return "Capacidade insuficiente para aprovar este pedido";
  if (message.includes("ORDER_NOT_PENDING")) return "Este pedido já foi analisado";
  if (message.includes("ORDER_NOT_FOUND")) return "Pedido não encontrado";
  if (message.includes("FORBIDDEN")) return "Você não tem permissão para esta ação";
  return "Não foi possível concluir a operação";
}
