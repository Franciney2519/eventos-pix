import { History } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listCheckinEvents, listCheckinHistory } from "@/features/checkin/repository";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CheckinHistoryPage({ searchParams }: { searchParams: { eventId?: string } }) {
  const supabase = await createClient();
  const events = await listCheckinEvents(supabase);
  const eventId = searchParams.eventId ?? events[0]?.id;
  const history = await listCheckinHistory(supabase, eventId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Histórico de check-ins</h1>
        <p className="text-sm text-gray-500">Todas as entradas confirmadas.</p>
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
          Filtrar
        </button>
      </form>

      {history.length === 0 ? (
        <EmptyState icon={History} title="Nenhum check-in registrado ainda" />
      ) : (
        <div className="card !p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
                <th className="px-5 py-3 font-medium">Horário</th>
                <th className="px-5 py-3 font-medium">Ingresso</th>
                <th className="px-5 py-3 font-medium">Participante</th>
                <th className="px-5 py-3 font-medium">Pedido</th>
                <th className="px-5 py-3 font-medium">Tipo</th>
              </tr>
            </thead>
            <tbody>
              {history.map((c) => {
                const ticket = c.tickets as unknown as {
                  ticket_number: string;
                  orders: { order_number: string; profiles: { full_name: string } | null } | null;
                } | null;
                return (
                  <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-500">{formatDateTime(c.checked_in_at)}</td>
                    <td className="px-5 py-3 font-mono text-gray-900">{ticket?.ticket_number}</td>
                    <td className="px-5 py-3 text-gray-700">{ticket?.orders?.profiles?.full_name}</td>
                    <td className="px-5 py-3 text-gray-500">{ticket?.orders?.order_number}</td>
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
