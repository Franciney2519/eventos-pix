import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listAllOrders } from "@/features/orders/repository";
import { PaymentStatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrencyBRL, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "all", label: "Todas" },
  { value: "PENDING", label: "Pendentes" },
  { value: "APPROVED", label: "Aprovadas" },
  { value: "REJECTED", label: "Rejeitadas" },
] as const;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const supabase = await createClient();
  const status = searchParams.status && searchParams.status !== "all" ? searchParams.status : undefined;
  const orders = await listAllOrders(supabase, { paymentStatus: status });

  const search = (searchParams.q ?? "").toLowerCase();
  const filtered = search
    ? orders.filter((o) => {
        const buyer = (o.profiles as unknown as { full_name: string; email: string } | null);
        return (
          o.order_number.toLowerCase().includes(search) ||
          buyer?.full_name?.toLowerCase().includes(search) ||
          buyer?.email?.toLowerCase().includes(search)
        );
      })
    : orders;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Solicitações</h1>
        <p className="text-sm text-gray-500">Analise e aprove os pagamentos recebidos via PIX.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-gray-100">
        <div className="flex gap-4 overflow-x-auto">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={`/admin/solicitacoes${f.value === "all" ? "" : `?status=${f.value}`}`}
              className={`shrink-0 border-b-2 px-1 pb-2.5 text-sm font-semibold ${
                (searchParams.status ?? "all") === f.value
                  ? "border-brand-600 text-brand-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        <form className="w-full pb-2 sm:w-64">
          <input
            type="search"
            name="q"
            defaultValue={searchParams.q}
            placeholder="Buscar por nome, e-mail ou número"
            className="input"
          />
        </form>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Nenhuma solicitação encontrada" />
      ) : (
        <div className="card !p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
                <th className="px-5 py-3 font-medium">Número</th>
                <th className="px-5 py-3 font-medium">Comprador</th>
                <th className="px-5 py-3 font-medium">Evento</th>
                <th className="px-5 py-3 font-medium">Qtd</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Data</th>
                <th className="px-5 py-3 font-medium">Origem</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">#{o.order_number}</td>
                  <td className="px-5 py-3 text-gray-700">
                    {(o.profiles as unknown as { full_name: string } | null)?.full_name}
                  </td>
                  <td className="px-5 py-3 text-gray-700">{(o.events as unknown as { name: string } | null)?.name}</td>
                  <td className="px-5 py-3 text-gray-700">{o.quantity}</td>
                  <td className="px-5 py-3 text-gray-700">{formatCurrencyBRL(o.total_amount)}</td>
                  <td className="px-5 py-3 text-gray-500">{formatDateTime(o.created_at)}</td>
                  <td className="px-5 py-3">
                    {o.sale_channel === "WALK_IN" ? (
                      <span className="badge-warning">Venda avulsa</span>
                    ) : (
                      <span className="badge-gray">Online</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <PaymentStatusBadge status={o.payment_status} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/admin/solicitacoes/${o.id}`} className="text-brand-600 hover:underline">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
