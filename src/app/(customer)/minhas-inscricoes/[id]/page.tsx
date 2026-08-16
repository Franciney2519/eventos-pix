import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, QrCode } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getOrderById } from "@/features/orders/repository";
import { getProofsForOrder } from "@/features/orders/repository";
import { listTicketsForOrder } from "@/features/tickets/repository";
import { OrderStatusBadge, PaymentStatusBadge, TicketStatusBadge } from "@/components/ui/status-badge";
import { formatCurrencyBRL, formatDateTime, formatEventDate, formatEventTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const supabase = await createClient();

  const order = await getOrderById(supabase, params.id);
  if (!order || order.user_id !== user.id) notFound();

  const [proofs, tickets] = await Promise.all([
    getProofsForOrder(supabase, order.id),
    listTicketsForOrder(supabase, order.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Solicitação recebida</p>
        <h1 className="text-2xl font-semibold text-gray-900">#{order.order_number}</h1>
      </div>

      <div className="card space-y-3">
        <Row label="Evento" value={order.events?.name ?? "-"} />
        {order.events && (
          <Row label="Data" value={`${formatEventDate(order.events.event_date)} às ${formatEventTime(order.events.event_time)}`} />
        )}
        <Row label="Quantidade" value={String(order.quantity)} />
        <Row label="Total" value={formatCurrencyBRL(order.total_amount)} />
        <Row label="Status do pagamento" value={<PaymentStatusBadge status={order.payment_status} />} />
        <Row label="Status do pedido" value={<OrderStatusBadge status={order.order_status} />} />
        <Row label="Enviado em" value={formatDateTime(order.created_at)} />

        {order.payment_status === "REJECTED" && order.rejection_reason && (
          <div className="rounded-xl bg-danger-50 p-3 text-sm text-danger-700">
            <strong>Motivo da rejeição:</strong> {order.rejection_reason}
          </div>
        )}
        {order.payment_status === "PENDING" && (
          <div className="rounded-xl bg-warning-50 p-3 text-sm text-warning-700">
            Aguardando análise do pagamento. Você será notificado por e-mail assim que for aprovado.
          </div>
        )}
      </div>

      {proofs.length > 0 && (
        <div className="card">
          <h2 className="mb-3 font-semibold text-gray-900">Comprovante enviado</h2>
          <ul className="space-y-2">
            {proofs.map((p) => (
              <li key={p.id} className="flex items-center gap-2 text-sm text-gray-600">
                <FileText size={16} /> {p.file_name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tickets.length > 0 && (
        <div className="card">
          <h2 className="mb-3 font-semibold text-gray-900">Ingressos</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {tickets.map((t) => (
              <li key={t.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
                <div>
                  <p className="font-mono text-sm font-medium text-gray-900">{t.ticket_number}</p>
                  <TicketStatusBadge status={t.status} />
                </div>
                <Link href={`/ticket/${t.token}`} className="btn-secondary !px-3 !py-2">
                  <QrCode size={16} /> Abrir
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-50 py-1.5 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
