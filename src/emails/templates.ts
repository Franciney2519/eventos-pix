import { formatCurrencyBRL, formatEventDate, formatEventTime } from "@/lib/format";

interface TicketsIssuedEmailParams {
  participantName: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  orderNumber: string;
  quantity: number;
  ticketUrls: { ticketNumber: string; url: string }[];
  myTicketsUrl: string;
}

const WRAPPER_STYLE =
  "font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background-color:#f9fafb;padding:32px 16px;";
const CARD_STYLE =
  "max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e5e7eb;";

export function buildTicketsIssuedEmailHtml(params: TicketsIssuedEmailParams): string {
  const ticketRows = params.ticketUrls
    .map(
      (t) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#374151;">${t.ticketNumber}</td>
          <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:right;">
            <a href="${t.url}" style="color:#2563eb;font-size:14px;text-decoration:none;font-weight:600;">Ver ingresso →</a>
          </td>
        </tr>`
    )
    .join("");

  return `
  <div style="${WRAPPER_STYLE}">
    <div style="${CARD_STYLE}">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-flex;width:56px;height:56px;border-radius:9999px;background:#dcfce7;align-items:center;justify-content:center;font-size:28px;">✅</div>
      </div>
      <h1 style="font-size:20px;color:#111827;text-align:center;margin:0 0 8px;">Pagamento confirmado!</h1>
      <p style="font-size:14px;color:#6b7280;text-align:center;margin:0 0 24px;">Olá, ${params.participantName}. Seus ingressos já estão disponíveis.</p>

      <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:16px;font-weight:600;color:#111827;">${params.eventName}</p>
        <p style="margin:0;font-size:14px;color:#6b7280;">${formatEventDate(params.eventDate)} às ${formatEventTime(params.eventTime)}</p>
        <p style="margin:0;font-size:14px;color:#6b7280;">${params.eventLocation}</p>
        <p style="margin:12px 0 0;font-size:13px;color:#9ca3af;">Pedido ${params.orderNumber} · ${params.quantity} ingresso(s)</p>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        ${ticketRows}
      </table>

      <div style="text-align:center;">
        <a href="${params.myTicketsUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:12px;">Acessar meus ingressos</a>
      </div>

      <p style="margin-top:28px;font-size:12px;color:#9ca3af;text-align:center;">Apresente o QR Code de cada ingresso na entrada do evento.</p>
    </div>
  </div>`;
}

interface OrderRejectedEmailParams {
  participantName: string;
  eventName: string;
  orderNumber: string;
  reason: string;
  eventsUrl: string;
}

export function buildOrderRejectedEmailHtml(params: OrderRejectedEmailParams): string {
  return `
  <div style="${WRAPPER_STYLE}">
    <div style="${CARD_STYLE}">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-flex;width:56px;height:56px;border-radius:9999px;background:#fee2e2;align-items:center;justify-content:center;font-size:28px;">⚠️</div>
      </div>
      <h1 style="font-size:20px;color:#111827;text-align:center;margin:0 0 8px;">Não foi possível confirmar seu pagamento</h1>
      <p style="font-size:14px;color:#6b7280;text-align:center;margin:0 0 24px;">Olá, ${params.participantName}.</p>

      <div style="background:#fef2f2;border-radius:12px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:16px;font-weight:600;color:#111827;">${params.eventName}</p>
        <p style="margin:0 0 12px;font-size:13px;color:#9ca3af;">Pedido ${params.orderNumber}</p>
        <p style="margin:0;font-size:14px;color:#b91c1c;"><strong>Motivo:</strong> ${escapeHtml(params.reason)}</p>
      </div>

      <p style="font-size:14px;color:#374151;text-align:center;">Você pode enviar uma nova solicitação a qualquer momento.</p>

      <div style="text-align:center;margin-top:16px;">
        <a href="${params.eventsUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:12px;">Ver eventos disponíveis</a>
      </div>
    </div>
  </div>`;
}

interface NewOrderNotificationEmailParams {
  eventName: string;
  buyerName: string;
  buyerEmail: string;
  orderNumber: string;
  quantity: number;
  totalAmount: number;
  reviewUrl: string;
}

export function buildNewOrderNotificationEmailHtml(params: NewOrderNotificationEmailParams): string {
  return `
  <div style="${WRAPPER_STYLE}">
    <div style="${CARD_STYLE}">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-flex;width:56px;height:56px;border-radius:9999px;background:#fef3c7;align-items:center;justify-content:center;font-size:28px;">🔔</div>
      </div>
      <h1 style="font-size:20px;color:#111827;text-align:center;margin:0 0 8px;">Nova solicitação de pagamento</h1>
      <p style="font-size:14px;color:#6b7280;text-align:center;margin:0 0 24px;">Um comprovante foi enviado e está aguardando sua análise.</p>

      <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:16px;font-weight:600;color:#111827;">${params.eventName}</p>
        <p style="margin:0;font-size:14px;color:#6b7280;">${escapeHtml(params.buyerName)} · ${escapeHtml(params.buyerEmail)}</p>
        <p style="margin:12px 0 0;font-size:13px;color:#9ca3af;">Pedido ${params.orderNumber} · ${params.quantity} ingresso(s) · ${formatCurrencyBRL(params.totalAmount)}</p>
      </div>

      <div style="text-align:center;">
        <a href="${params.reviewUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:12px;">Analisar comprovante</a>
      </div>
    </div>
  </div>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export { formatCurrencyBRL };
