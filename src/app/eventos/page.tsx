import { CalendarX } from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { createClient } from "@/lib/supabase/server";
import { listPublicEvents, getApprovedTicketQuantity } from "@/features/events/repository";
import { EventCard } from "@/features/events/components/event-card";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const supabase = await createClient();
  const events = await listPublicEvents(supabase);

  const withAvailability = await Promise.all(
    events.map(async (event) => {
      const approved = await getApprovedTicketQuantity(supabase, event.id);
      return { event, availableSeats: Math.max(0, event.capacity - approved) };
    })
  );

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold text-gray-900">Eventos disponíveis</h1>
        <p className="mt-1 text-sm text-gray-500">Escolha um evento para ver detalhes e garantir seu ingresso.</p>

        {withAvailability.length === 0 ? (
          <div className="mt-8">
            <EmptyState icon={CalendarX} title="Nenhum evento disponível" description="Volte em breve para conferir novidades." />
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {withAvailability.map(({ event, availableSeats }) => (
              <EventCard key={event.id} event={event} availableSeats={availableSeats} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
