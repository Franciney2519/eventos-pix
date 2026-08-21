import { CalendarX } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listCheckinEvents, getEventCheckinStats } from "@/features/checkin/repository";
import { EmptyState } from "@/components/ui/empty-state";
import { WalkInSaleForm } from "@/features/checkin/components/walk-in-sale-form";

export const dynamic = "force-dynamic";

export default async function WalkInSalePage({ searchParams }: { searchParams: { eventId?: string } }) {
  const supabase = await createClient();
  const events = await listCheckinEvents(supabase);

  if (events.length === 0) {
    return <EmptyState icon={CalendarX} title="Nenhum evento disponível" />;
  }

  const selectedEventId = searchParams.eventId ?? events[0]!.id;
  const selectedEvent = events.find((e) => e.id === selectedEventId) ?? events[0]!;
  const stats = await getEventCheckinStats(supabase, selectedEventId);

  // Fetch fields listCheckinEvents doesn't select.
  const { data: fullEvent } = await supabase
    .from("events")
    .select("ticket_price, pix_key, pix_holder_name")
    .eq("id", selectedEventId)
    .single();

  const availableSeats = Math.max(0, selectedEvent.capacity - stats.approvedTickets);

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Venda avulsa</h1>
        <p className="text-sm text-gray-500">{selectedEvent.name} · {availableSeats} vaga(s) disponível(is)</p>
      </div>

      {availableSeats <= 0 ? (
        <div className="card border-2 border-danger-200 bg-danger-50 text-center text-sm font-semibold text-danger-600">
          Ingressos esgotados — não é possível registrar novas vendas.
        </div>
      ) : (
        <WalkInSaleForm
          eventId={selectedEventId}
          ticketPrice={fullEvent?.ticket_price ?? 0}
          pixKey={fullEvent?.pix_key ?? ""}
          pixHolderName={fullEvent?.pix_holder_name ?? ""}
        />
      )}
    </div>
  );
}
