import "server-only";
import sgMail from "@sendgrid/mail";
import { createAdminClient } from "@/lib/supabase/admin";
import { ticketPublicUrl } from "@/lib/tickets/token";
import { buildOrderRejectedEmailHtml, buildTicketsIssuedEmailHtml } from "./templates";

let configured = false;
function ensureConfigured() {
  if (configured) return;
  const key = process.env.SENDGRID_API_KEY;
  if (!key) throw new Error("SENDGRID_API_KEY is not configured");
  sgMail.setApiKey(key);
  configured = true;
}

function fromAddress() {
  return {
    email: process.env.SENDGRID_FROM_EMAIL ?? "no-reply@example.com",
    name: process.env.SENDGRID_FROM_NAME ?? "App Ingresso",
  };
}

/**
 * Sends the "payment confirmed / tickets issued" email for an order.
 * Reusable entry point for both the approval flow and admin "resend" action.
 */
export async function sendTicketsIssuedEmail(orderId: string): Promise<void> {
  const admin = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("*, events(name, event_date, event_time, location)")
    .eq("id", orderId)
    .single();
  if (orderError || !order) throw new Error("Order not found for email");

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("user_id", order.user_id)
    .single();
  if (!profile) throw new Error("Recipient profile not found");

  const { data: tickets, error: ticketsError } = await admin
    .from("tickets")
    .select("ticket_number, token")
    .eq("order_id", orderId)
    .order("ticket_number", { ascending: true });
  if (ticketsError) throw ticketsError;

  const event = (order as unknown as { events: { name: string; event_date: string; event_time: string; location: string } }).events;

  const html = buildTicketsIssuedEmailHtml({
    participantName: profile.full_name,
    eventName: event.name,
    eventDate: event.event_date,
    eventTime: event.event_time,
    eventLocation: event.location,
    orderNumber: order.order_number,
    quantity: order.quantity,
    ticketUrls: (tickets ?? []).map((t) => ({
      ticketNumber: t.ticket_number,
      url: ticketPublicUrl(appUrl, t.token),
    })),
    myTicketsUrl: `${appUrl}/meus-ingressos`,
  });

  await sendAndLog({
    orderId,
    userId: order.user_id,
    type: "TICKETS_ISSUED",
    recipient: profile.email,
    subject: "Pagamento confirmado — seus ingressos estão disponíveis",
    html,
  });
}

export async function sendOrderRejectedEmail(orderId: string): Promise<void> {
  const admin = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("*, events(name)")
    .eq("id", orderId)
    .single();
  if (orderError || !order) throw new Error("Order not found for email");

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("user_id", order.user_id)
    .single();
  if (!profile) throw new Error("Recipient profile not found");

  const event = (order as unknown as { events: { name: string } }).events;

  const html = buildOrderRejectedEmailHtml({
    participantName: profile.full_name,
    eventName: event.name,
    orderNumber: order.order_number,
    reason: order.rejection_reason ?? "Não especificado",
    eventsUrl: `${appUrl}/eventos`,
  });

  await sendAndLog({
    orderId,
    userId: order.user_id,
    type: "ORDER_REJECTED",
    recipient: profile.email,
    subject: "Sobre sua solicitação de ingressos",
    html,
  });
}

async function sendAndLog(params: {
  orderId: string;
  userId: string;
  type: "TICKETS_ISSUED" | "ORDER_REJECTED";
  recipient: string;
  subject: string;
  html: string;
}) {
  const admin = createAdminClient();

  try {
    ensureConfigured();
    const [response] = await sgMail.send({
      to: params.recipient,
      from: fromAddress(),
      subject: params.subject,
      html: params.html,
    });

    await admin.from("email_logs").insert({
      order_id: params.orderId,
      user_id: params.userId,
      type: params.type,
      recipient: params.recipient,
      status: "SENT",
      provider_message_id: response.headers["x-message-id"] ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await admin.from("email_logs").insert({
      order_id: params.orderId,
      user_id: params.userId,
      type: params.type,
      recipient: params.recipient,
      status: "FAILED",
      error_message: message,
    });
    throw err;
  }
}
