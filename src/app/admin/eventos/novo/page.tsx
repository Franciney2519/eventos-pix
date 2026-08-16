import { EventForm } from "@/features/events/components/event-form";

export default function NewEventPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Novo evento</h1>
        <p className="text-sm text-gray-500">Preencha os dados do evento.</p>
      </div>
      <div className="card">
        <EventForm />
      </div>
    </div>
  );
}
