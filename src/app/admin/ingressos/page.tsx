import { Ticket as TicketIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listAllTickets } from "@/features/tickets/repository";
import { listAllEvents } from "@/features/events/repository";
import { EmptyState } from "@/components/ui/empty-state";
import { TicketsTable, type TicketRowData } from "@/features/tickets/components/tickets-table";

export const dynamic = "force-dynamic";

export default async function AdminTicketsPage({ searchParams }: { searchParams: { eventId?: string } }) {
  const supabase = await createClient();
  const events = await listAllEvents(supabase);
  const rawTickets = await listAllTickets(supabase, searchParams.eventId);

  const tickets: TicketRowData[] = rawTickets.map((t) => ({
    id: t.id,
    ticket_number: t.ticket_number,
    status: t.status,
    issued_at: t.issued_at,
    eventName: (t.events as unknown as { name: string } | null)?.name,
    orderNumber: (t.orders as unknown as { order_number: string } | null)?.order_number,
    participantName: (t.orders as unknown as { profiles: { full_name: string } | null } | null)?.profiles
      ?.full_name,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Ingressos</h1>
        <p className="text-sm text-gray-500">Todos os ingressos emitidos na plataforma. Selecione para gerar crachás.</p>
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
        <TicketsTable tickets={tickets} />
      )}
    </div>
  );
}
