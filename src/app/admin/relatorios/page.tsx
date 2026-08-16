import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listAllEvents } from "@/features/events/repository";
import { getGlobalIndicators } from "@/features/reports/repository";
import { formatCurrencyBRL } from "@/lib/format";

export const dynamic = "force-dynamic";

const REPORTS = [
  { type: "orders", label: "Pedidos" },
  { type: "payments", label: "Pagamentos" },
  { type: "tickets", label: "Ingressos" },
  { type: "checkins", label: "Check-ins" },
] as const;

export default async function AdminReportsPage({ searchParams }: { searchParams: { eventId?: string } }) {
  const supabase = await createClient();
  const [indicators, events] = await Promise.all([getGlobalIndicators(supabase), listAllEvents(supabase)]);
  const attendanceRate = indicators.totalTickets > 0 ? Math.round((indicators.checkins / indicators.totalTickets) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Relatórios</h1>
        <p className="text-sm text-gray-500">Indicadores gerais e exportação de dados.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total de usuários" value={indicators.totalUsers} />
        <Stat label="Total de pedidos" value={indicators.totalOrders} />
        <Stat label="Total de ingressos" value={indicators.totalTickets} />
        <Stat label="Pagamentos aprovados" value={indicators.approvedPayments} />
        <Stat label="Pagamentos pendentes" value={indicators.pendingPayments} />
        <Stat label="Receita confirmada" value={formatCurrencyBRL(indicators.confirmedRevenue)} />
        <Stat label="Check-ins" value={indicators.checkins} />
        <Stat label="Taxa de comparecimento" value={`${attendanceRate}%`} />
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900">Exportar CSV</h2>
        <form className="flex flex-wrap items-center gap-3">
          <select name="eventId" defaultValue={searchParams.eventId ?? ""} className="input max-w-xs">
            <option value="">Todos os eventos</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </form>
        <div className="flex flex-wrap gap-3">
          {REPORTS.map((r) => (
            <a
              key={r.type}
              href={`/api/admin/relatorios/export?type=${r.type}${searchParams.eventId ? `&eventId=${searchParams.eventId}` : ""}`}
              className="btn-secondary"
            >
              <Download size={16} /> {r.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card">
      <p className="text-xl font-semibold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
