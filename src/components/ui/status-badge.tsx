import clsx from "clsx";

type BadgeTone = "success" | "warning" | "danger" | "gray";

const TONE_CLASS: Record<BadgeTone, string> = {
  success: "badge-success",
  warning: "badge-warning",
  danger: "badge-danger",
  gray: "badge-gray",
};

const PAYMENT_STATUS_MAP: Record<string, { label: string; tone: BadgeTone }> = {
  PENDING: { label: "Aguardando análise", tone: "warning" },
  APPROVED: { label: "Aprovado", tone: "success" },
  REJECTED: { label: "Rejeitado", tone: "danger" },
};

const ORDER_STATUS_MAP: Record<string, { label: string; tone: BadgeTone }> = {
  WAITING_PAYMENT_REVIEW: { label: "Aguardando análise", tone: "warning" },
  CONFIRMED: { label: "Confirmado", tone: "success" },
  TICKETS_ISSUED: { label: "Ingressos emitidos", tone: "success" },
  CANCELLED: { label: "Cancelado", tone: "danger" },
};

const TICKET_STATUS_MAP: Record<string, { label: string; tone: BadgeTone }> = {
  AVAILABLE: { label: "Disponível", tone: "success" },
  USED: { label: "Utilizado", tone: "gray" },
  CANCELLED: { label: "Cancelado", tone: "danger" },
};

const EVENT_STATUS_MAP: Record<string, { label: string; tone: BadgeTone }> = {
  DRAFT: { label: "Rascunho", tone: "gray" },
  OPEN: { label: "Inscrições abertas", tone: "success" },
  CLOSED: { label: "Inscrições encerradas", tone: "warning" },
  FINISHED: { label: "Finalizado", tone: "gray" },
  CANCELLED: { label: "Cancelado", tone: "danger" },
};

const EMAIL_STATUS_MAP: Record<string, { label: string; tone: BadgeTone }> = {
  SENT: { label: "Enviado", tone: "success" },
  FAILED: { label: "Falhou", tone: "danger" },
};

function Badge({ label, tone }: { label: string; tone: BadgeTone }) {
  return <span className={clsx(TONE_CLASS[tone])}>{label}</span>;
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const cfg = PAYMENT_STATUS_MAP[status] ?? { label: status, tone: "gray" as const };
  return <Badge {...cfg} />;
}

export function OrderStatusBadge({ status }: { status: string }) {
  const cfg = ORDER_STATUS_MAP[status] ?? { label: status, tone: "gray" as const };
  return <Badge {...cfg} />;
}

export function TicketStatusBadge({ status }: { status: string }) {
  const cfg = TICKET_STATUS_MAP[status] ?? { label: status, tone: "gray" as const };
  return <Badge {...cfg} />;
}

export function EventStatusBadge({ status }: { status: string }) {
  const cfg = EVENT_STATUS_MAP[status] ?? { label: status, tone: "gray" as const };
  return <Badge {...cfg} />;
}

export function EmailStatusBadge({ status }: { status: string }) {
  const cfg = EMAIL_STATUS_MAP[status] ?? { label: status, tone: "gray" as const };
  return <Badge {...cfg} />;
}
