import { Ticket as TicketIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listAllTickets } from "@/features/tickets/repository";
import { listAllEvents } from "@/features/events/repository";
import { TicketStatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CancelTicketButton } from "@/features/tickets/components/cancel-ticket-button";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminTicketsPage({ searchParams }: { searchParams: { eventId?: string } }) {
  const supabase = await createClient();
  const events = await listAllEvents(supabase);
  const tickets = await listAllTickets(supabase, searchParams.eventId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Ingressos</h1>
        <p className="text-sm text-gray-500">Todos os ingressos emitidos na plataforma.</p>
      </div>

      <form className="flex gap-2">
        <select name="eventId" defaultValue={searchParams.eventId ?? ""} className="input max-w-xs">
          <option value="">Todos os eventos</option>
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

      {tickets.length === 0 ? (
        <EmptyState icon={TicketIcon} title="Nenhum ingresso emitido ainda" />
      ) : (
        <div className="card !p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
                <th className="px-5 py-3 font-medium">Ingresso</th>
                <th className="px-5 py-3 font-medium">Evento</th>
                <th className="px-5 py-3 font-medium">Pedido</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Emitido em</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono font-medium text-gray-900">{t.ticket_number}</td>
                  <td className="px-5 py-3 text-gray-700">{(t.events as unknown as { name: string } | null)?.name}</td>
                  <td className="px-5 py-3 text-gray-700">
                    {(t.orders as unknown as { order_number: string } | null)?.order_number}
                  </td>
                  <td className="px-5 py-3">
                    <TicketStatusBadge status={t.status} />
                  </td>
                  <td className="px-5 py-3 text-gray-500">{formatDateTime(t.issued_at)}</td>
                  <td className="px-5 py-3 text-right">
                    <CancelTicketButton ticketId={t.id} disabled={t.status !== "AVAILABLE"} />
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
