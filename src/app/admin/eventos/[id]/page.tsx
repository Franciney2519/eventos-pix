import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEventById } from "@/features/events/repository";
import { EventForm } from "@/features/events/components/event-form";
import { EventStatusActions } from "@/features/events/components/event-status-actions";

export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const event = await getEventById(supabase, params.id);
  if (!event) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{event.name}</h1>
          <p className="text-sm text-gray-500">Editar evento</p>
        </div>
        <EventStatusActions eventId={event.id} status={event.status} />
      </div>
      <div className="card">
        <EventForm event={event} />
      </div>
    </div>
  );
}
