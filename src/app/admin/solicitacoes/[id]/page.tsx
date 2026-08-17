import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText, QrCode } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getOrderById, getProofsForOrder } from "@/features/orders/repository";
import { listTicketsForOrder } from "@/features/tickets/repository";
import { getSignedProofUrl } from "@/features/orders/actions";
import { OrderStatusBadge, PaymentStatusBadge, TicketStatusBadge } from "@/components/ui/status-badge";
import { formatCurrencyBRL, formatDateTime, formatEventDate, formatEventTime } from "@/lib/format";
import { OrderReviewActions } from "@/features/orders/components/order-review-actions";
import { ProofObservationForm } from "@/features/orders/components/proof-observation-form";
import { ResendEmailButton } from "@/features/tickets/components/resend-email-button";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const order = await getOrderById(supabase, params.id);
  if (!order) notFound();

  const { data: buyer } = await supabase
    .from("profiles")
    .select("full_name, email, phone")
    .eq("user_id", order.user_id)
    .single();

  const [proofs, tickets] = await Promise.all([
    getProofsForOrder(supabase, order.id),
    listTicketsForOrder(supabase, order.id),
  ]);

  const proofsWithUrl = await Promise.all(
    proofs.map(async (p) => ({ ...p, signedUrl: await getSignedProofUrl(p.file_path) }))
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="text-sm text-gray-500">Solicitação</p>
        <h1 className="text-2xl font-semibold text-gray-900">#{order.order_number}</h1>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="card space-y-2">
          <h2 className="font-semibold text-gray-900">Comprador</h2>
          <p className="text-sm text-gray-700">{buyer?.full_name}</p>
          <p className="text-sm text-gray-500">{buyer?.email}</p>
          <p className="text-sm text-gray-500">{buyer?.phone}</p>
        </div>
        <div className="card space-y-2">
          <h2 className="font-semibold text-gray-900">Evento</h2>
          <p className="text-sm text-gray-700">{order.events?.name}</p>
          {order.events && (
            <p className="text-sm text-gray-500">
              {formatEventDate(order.events.event_date)} às {formatEventTime(order.events.event_time)}
            </p>
          )}
          <p className="text-sm text-gray-500">{order.events?.location}</p>
        </div>
      </div>

      <div className="card space-y-2">
        <Row label="Quantidade" value={String(order.quantity)} />
        <Row label="Valor unitário" value={formatCurrencyBRL(order.unit_price)} />
        <Row label="Total" value={formatCurrencyBRL(order.total_amount)} />
        <Row label="Status do pagamento" value={<PaymentStatusBadge status={order.payment_status} />} />
        <Row label="Status do pedido" value={<OrderStatusBadge status={order.order_status} />} />
        <Row label="Enviado em" value={formatDateTime(order.created_at)} />
        {order.approved_at && <Row label="Aprovado em" value={formatDateTime(order.approved_at)} />}
        {order.rejected_at && <Row label="Rejeitado em" value={formatDateTime(order.rejected_at)} />}
        {order.rejection_reason && <Row label="Motivo" value={order.rejection_reason} />}
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900">Comprovante</h2>
        {proofsWithUrl.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum comprovante enviado.</p>
        ) : (
          proofsWithUrl.map((p) => (
            <div key={p.id} className="space-y-3 rounded-xl border border-gray-100 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2 break-all text-sm text-gray-700">
                  <FileText size={16} className="shrink-0" /> {p.file_name}
                </span>
                {p.signedUrl && (
                  <a href={p.signedUrl} target="_blank" rel="noreferrer" className="shrink-0 text-sm text-brand-600 hover:underline">
                    Visualizar
                  </a>
                )}
              </div>
              {p.signedUrl && p.mime_type.startsWith("image/") && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.signedUrl} alt={p.file_name} className="max-h-80 rounded-lg border border-gray-100" />
              )}
              <ProofObservationForm proofId={p.id} initialObservation={p.observation} />
            </div>
          ))
        )}
      </div>

      {order.payment_status === "PENDING" && <OrderReviewActions orderId={order.id} />}

      {tickets.length > 0 && (
        <div className="card">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-gray-900">Ingressos emitidos</h2>
            <ResendEmailButton orderId={order.id} />
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {tickets.map((t) => (
              <li key={t.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
                <div>
                  <p className="font-mono text-sm font-medium text-gray-900">{t.ticket_number}</p>
                  <TicketStatusBadge status={t.status} />
                </div>
                <Link href={`/ticket/${t.token}`} className="btn-secondary !px-3 !py-2">
                  <QrCode size={16} />
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
