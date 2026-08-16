import { ScanLine } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listAllEvents } from "@/features/events/repository";
import { getEventIndicators } from "@/features/reports/repository";
import { listCheckinHistory } from "@/features/checkin/repository";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminCheckinsPage({ searchParams }: { searchParams: { eventId?: string } }) {
  const supabase = await createClient();
  const events = await listAllEvents(supabase);
  const eventId = searchParams.eventId ?? events[0]?.id;

  const [indicators, history] = await Promise.all([
    eventId ? getEventIndicators(supabase, eventId) : null,
    listCheckinHistory(supabase, eventId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Check-ins</h1>
        <p className="text-sm text-gray-500">Acompanhe a presença confirmada em cada evento.</p>
      </div>

      <form className="flex gap-2">
        <select name="eventId" defaultValue={eventId} className="input max-w-xs">
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        <button className="btn-secondary" type="submit">
          Selecionar
        </button>
      </form>

      {indicators && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Capacidade" value={indicators.capacity} />
          <Stat label="Ingressos emitidos" value={indicators.ticketsIssued} />
          <Stat label="Check-ins realizados" value={indicators.checkins} />
          <Stat label="Taxa de comparecimento" value={`${indicators.attendanceRate}%`} />
        </div>
      )}

      {history.length === 0 ? (
        <EmptyState icon={ScanLine} title="Nenhum check-in registrado ainda" />
      ) : (
        <div className="card !p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
                <th className="px-5 py-3 font-medium">Horário</th>
                <th className="px-5 py-3 font-medium">Ingresso</th>
                <th className="px-5 py-3 font-medium">Participante</th>
                <th className="px-5 py-3 font-medium">Tipo</th>
              </tr>
            </thead>
            <tbody>
              {history.map((c) => {
                const ticket = c.tickets as unknown as {
                  ticket_number: string;
                  orders: { profiles: { full_name: string } | null } | null;
                } | null;
                return (
                  <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-500">{formatDateTime(c.checked_in_at)}</td>
                    <td className="px-5 py-3 font-mono text-gray-900">{ticket?.ticket_number}</td>
                    <td className="px-5 py-3 text-gray-700">{ticket?.orders?.profiles?.full_name}</td>
                    <td className="px-5 py-3 text-gray-500">{c.source === "QR" ? "QR Code" : "Manual"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
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
