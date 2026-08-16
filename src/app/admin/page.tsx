import Link from "next/link";
import { Users, ClipboardList, CheckCircle2, Ticket, ScanLine, DollarSign, Clock, LayoutGrid } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getGlobalIndicators, listRecentOrders } from "@/features/reports/repository";
import { OrderStatusBadge } from "@/components/ui/status-badge";
import { formatCurrencyBRL, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const [indicators, recentOrders] = await Promise.all([
    getGlobalIndicators(supabase),
    listRecentOrders(supabase),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Visão geral de todos os eventos.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric icon={Users} label="Usuários" value={indicators.totalUsers} />
        <Metric icon={ClipboardList} label="Pedidos" value={indicators.totalOrders} />
        <Metric icon={Clock} label="Pagamentos pendentes" value={indicators.pendingPayments} tone="warning" />
        <Metric icon={CheckCircle2} label="Pagamentos aprovados" value={indicators.approvedPayments} tone="success" />
        <Metric icon={Ticket} label="Ingressos emitidos" value={indicators.totalTickets} />
        <Metric icon={ScanLine} label="Check-ins realizados" value={indicators.checkins} />
        <Metric icon={DollarSign} label="Receita confirmada" value={formatCurrencyBRL(indicators.confirmedRevenue)} />
        <Link href="/admin/eventos" className="card flex items-center gap-4 hover:border-brand-200">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <LayoutGrid size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Gerenciar eventos</p>
            <p className="text-xs text-gray-500">Criar e editar</p>
          </div>
        </Link>
      </div>

      <div className="card !p-0 overflow-x-auto">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="font-semibold text-gray-900">Solicitações recentes</h2>
          <Link href="/admin/solicitacoes" className="text-sm text-brand-600 hover:underline">
            Ver todas
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-gray-100 text-left text-xs uppercase text-gray-400">
              <th className="px-5 py-3 font-medium">Pedido</th>
              <th className="px-5 py-3 font-medium">Comprador</th>
              <th className="px-5 py-3 font-medium">Evento</th>
              <th className="px-5 py-3 font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Data</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((o) => (
              <tr key={o.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <td className="px-5 py-3">
                  <Link href={`/admin/solicitacoes/${o.id}`} className="font-medium text-brand-600 hover:underline">
                    #{o.order_number}
                  </Link>
                </td>
                <td className="px-5 py-3 text-gray-700">
                  {(o.profiles as unknown as { full_name: string } | null)?.full_name ?? "-"}
                </td>
                <td className="px-5 py-3 text-gray-700">{(o.events as unknown as { name: string } | null)?.name ?? "-"}</td>
                <td className="px-5 py-3 text-gray-700">{formatCurrencyBRL(o.total_amount)}</td>
                <td className="px-5 py-3">
                  <OrderStatusBadge status={o.payment_status} />
                </td>
                <td className="px-5 py-3 text-gray-500">{formatDateTime(o.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
  tone?: "default" | "warning" | "success";
}) {
  const toneClass =
    tone === "warning" ? "bg-warning-50 text-warning-600" : tone === "success" ? "bg-success-50 text-success-600" : "bg-brand-50 text-brand-600";

  return (
    <div className="card">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${toneClass}`}>
        <Icon size={18} />
      </div>
      <p className="text-xl font-semibold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
