import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listOrdersForUser } from "@/features/orders/repository";
import { OrderStatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrencyBRL, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "all", label: "Todos" },
  { value: "PENDING", label: "Pendentes" },
  { value: "APPROVED", label: "Aprovados" },
  { value: "REJECTED", label: "Rejeitados" },
] as const;

export default async function MyOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const user = await requireUser();
  const supabase = await createClient();
  const orders = await listOrdersForUser(supabase, user.id);

  const activeFilter = searchParams.status ?? "all";
  const filtered = activeFilter === "all" ? orders : orders.filter((o) => o.payment_status === activeFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Minhas inscrições</h1>
        <p className="text-sm text-gray-500">Acompanhe o status das suas solicitações de compra.</p>
      </div>

      <div className="flex gap-4 overflow-x-auto border-b-2 border-gray-100">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "all" ? "/minhas-inscricoes" : `/minhas-inscricoes?status=${f.value}`}
            className={`shrink-0 border-b-2 px-1 pb-2.5 text-sm font-semibold ${
              activeFilter === f.value ? "border-brand-600 text-brand-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Nenhuma inscrição encontrada" description="Suas solicitações de compra aparecerão aqui." />
      ) : (
        <div className="card !p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
                <th className="px-5 py-3 font-medium">Pedido</th>
                <th className="px-5 py-3 font-medium">Evento</th>
                <th className="px-5 py-3 font-medium">Qtd</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <Link href={`/minhas-inscricoes/${o.id}`} className="font-medium text-brand-600 hover:underline">
                      #{o.order_number}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-700">{o.events?.name}</td>
                  <td className="px-5 py-3 text-gray-700">{o.quantity}</td>
                  <td className="px-5 py-3 text-gray-700">{formatCurrencyBRL(o.total_amount)}</td>
                  <td className="px-5 py-3">
                    <OrderStatusBadge status={o.order_status} />
                  </td>
                  <td className="px-5 py-3 text-gray-500">{formatDateTime(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
