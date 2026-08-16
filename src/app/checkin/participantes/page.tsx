import { CalendarX } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listCheckinEvents, listParticipantsForCheckin } from "@/features/checkin/repository";
import { addDaysToDateKey } from "@/lib/checkin/timezone";
import { EmptyState } from "@/components/ui/empty-state";
import { ParticipantsPanel } from "@/features/checkin/components/participants-panel";
import { formatEventDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CheckinParticipantsPage({ searchParams }: { searchParams: { eventId?: string } }) {
  const supabase = await createClient();
  const events = await listCheckinEvents(supabase);

  if (events.length === 0) {
    return <EmptyState icon={CalendarX} title="Nenhum evento disponível" />;
  }

  const selectedEventId = searchParams.eventId ?? events[0]!.id;
  const selectedEvent = events.find((e) => e.id === selectedEventId) ?? events[0]!;
  const participants = await listParticipantsForCheckin(supabase, selectedEventId);

  const day1Key = selectedEvent.event_date;
  const day2Key = addDaysToDateKey(day1Key, 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Participantes</h1>
        <p className="text-sm text-gray-500">{selectedEvent.name} — lista completa de ingressos e presença por dia.</p>
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

      <ParticipantsPanel
        participants={participants}
        day1Key={day1Key}
        day2Key={day2Key}
        day1Label={`Dia 1 (${formatEventDate(day1Key)})`}
        day2Label={`Dia 2 (${formatEventDate(day2Key)})`}
      />
    </div>
  );
}
