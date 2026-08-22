import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listAllEvents } from "@/features/events/repository";
import { getGlobalIndicators, getEventIndicators } from "@/features/reports/repository";
import { formatCurrencyBRL } from "@/lib/format";
import { ExecutiveSummaryCard } from "./ExecutiveSummaryCard";

export const dynamic = "force-dynamic";

const REPORTS = [
  { type: "orders", label: "Pedidos" },
  { type: "payments", label: "Pagamentos" },
  { type: "tickets", label: "Ingressos" },
  { type: "checkins", label: "Check-ins" },
] as const;

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: { eventId?: string; summaryEventId?: string };
}) {
  const supabase = await createClient();
  const [indicators, events] = await Promise.all([getGlobalIndicators(supabase), listAllEvents(supabase)]);
  const attendanceRate = indicators.totalTickets > 0 ? Math.round((indicators.checkins / indicators.totalTickets) * 100) : 0;

  const summaryEventId = searchParams.summaryEventId ?? events[0]?.id;
  const summaryEvent = events.find((e) => e.id === summaryEventId);
  const eventIndicators = summaryEvent ? await getEventIndicators(supabase, summaryEvent.id) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Relatórios</h1>
        <p className="text-sm text-gray-500">Indicadores gerais e exportação de dados.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total de usuários" value={indicators.totalUsers} />
        <Stat label="Total de pedidos" value={indicators.totalOrders} />
        <Stat label="Total de ingressos" value={indicators.totalTickets} />
        <Stat label="Pagamentos aprovados" value={indicators.approvedPayments} hint={`${indicators.approvedPayments} de ${indicators.totalOrders} pedidos`} />
        <Stat label="Pagamentos pendentes" value={indicators.pendingPayments} />
        <Stat
          label="Receita confirmada"
          value={formatCurrencyBRL(indicators.confirmedRevenue)}
          hint={`${indicators.approvedPayments} pagamentos aprovados`}
        />
        <Stat label="Check-ins" value={indicators.checkins} />
        <AttendanceStat rate={attendanceRate} checkins={indicators.checkins} total={indicators.totalTickets} />
      </div>

      <div className="card space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">Resumo executivo por evento</h2>
          <p className="text-xs text-gray-500">Gere uma imagem resumida para compartilhar no WhatsApp.</p>
        </div>
        <form method="get" className="flex max-w-md items-end gap-2">
          <div className="flex-1">
            <label htmlFor="summaryEventId" className="label">
              Evento
            </label>
            <select id="summaryEventId" name="summaryEventId" defaultValue={summaryEvent?.id ?? ""} className="input">
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-secondary">
            Ver
          </button>
        </form>
        {summaryEvent && eventIndicators ? (
          <ExecutiveSummaryCard
            data={{
              eventName: summaryEvent.name,
              eventDate: summaryEvent.event_date,
              capacity: eventIndicators.capacity,
              sold: eventIndicators.approvedPayments,
              pending: eventIndicators.pendingPayments,
              available: eventIndicators.remainingSeats,
              onlineOrders: eventIndicators.onlineOrders,
              walkInOrders: eventIndicators.walkInOrders,
            }}
          />
        ) : (
          <p className="text-sm text-gray-500">Nenhum evento cadastrado.</p>
        )}
      </div>

      <div className="card space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">Exportar dados</h2>
          <p className="text-xs text-gray-500">Baixe um CSV com os dados do evento e relatório selecionados.</p>
        </div>
        <form action="/api/admin/relatorios/export" method="get" className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label htmlFor="eventId" className="label">
              Evento
            </label>
            <select id="eventId" name="eventId" defaultValue={searchParams.eventId ?? ""} className="input">
              <option value="">Todos os eventos</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="type" className="label">
              Tipo de relatório
            </label>
            <select id="type" name="type" defaultValue="orders" className="input">
              {REPORTS.map((r) => (
                <option key={r.type} value={r.type}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary">
            <Download size={16} /> Exportar CSV
          </button>
        </form>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="card">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold text-gray-900">{value}</p>
      {hint && <p className="mt-1.5 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

function AttendanceStat({ rate, checkins, total }: { rate: number; checkins: number; total: number }) {
  return (
    <div className="card">
      <p className="text-xs font-medium text-gray-500">Taxa de comparecimento</p>
      <p className="mt-1.5 text-2xl font-semibold text-gray-900">{rate}%</p>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.min(rate, 100)}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-gray-500">
        {checkins} de {total} ingressos utilizados
      </p>
    </div>
  );
}
