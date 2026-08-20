import { CalendarX } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listCheckinEvents, getEventCheckinStats, listCheckinHistory } from "@/features/checkin/repository";
import { EmptyState } from "@/components/ui/empty-state";
import { CheckinPanel } from "@/features/checkin/components/checkin-panel";
import { formatEventDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CheckinPage({ searchParams }: { searchParams: { eventId?: string } }) {
  const supabase = await createClient();
  const events = await listCheckinEvents(supabase);

  if (events.length === 0) {
    return <EmptyState icon={CalendarX} title="Nenhum evento disponível para check-in" />;
  }

  const selectedEventId = searchParams.eventId ?? events[0]!.id;
  const selectedEvent = events.find((e) => e.id === selectedEventId) ?? events[0]!;
  const [stats, recentCheckins] = await Promise.all([
    getEventCheckinStats(supabase, selectedEventId),
    listCheckinHistory(supabase, selectedEventId, 8),
  ]);

  const recent = recentCheckins.map((c) => {
    const ticket = c.tickets as unknown as {
      ticket_number: string;
      attendee_name: string | null;
      orders: { profiles: { full_name: string } | null } | null;
    } | null;
    return {
      id: c.id,
      ticketNumber: ticket?.ticket_number ?? "-",
      participantName: ticket?.attendee_name ?? ticket?.orders?.profiles?.full_name ?? "-",
      checkedInAt: c.checked_in_at,
      source: c.source,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{selectedEvent.name}</h1>
        <p className="text-sm text-gray-500">{formatEventDate(selectedEvent.event_date)} · {selectedEvent.location}</p>
      </div>

      <form className="flex gap-2">
        <select name="eventId" defaultValue={selectedEventId} className="input max-w-xs">
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        <button className="btn-secondary" type="submit">
          Trocar evento
        </button>
      </form>

      <CheckinPanel
        eventId={selectedEventId}
        checkedIn={stats.checkedIn}
        approvedTickets={stats.approvedTickets}
        capacity={selectedEvent.capacity}
        recentCheckins={recent}
      />
    </div>
  );
}
