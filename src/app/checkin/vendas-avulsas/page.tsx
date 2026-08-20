import { CalendarX } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listCheckinEvents, listWalkInSales } from "@/features/checkin/repository";
import { EmptyState } from "@/components/ui/empty-state";
import { WalkInSalesList } from "@/features/checkin/components/walk-in-sales-list";

export const dynamic = "force-dynamic";

export default async function WalkInSalesHistoryPage({ searchParams }: { searchParams: { eventId?: string } }) {
  const supabase = await createClient();
  const events = await listCheckinEvents(supabase);

  if (events.length === 0) {
    return <EmptyState icon={CalendarX} title="Nenhum evento disponível" />;
  }

  const selectedEventId = searchParams.eventId ?? events[0]!.id;
  const selectedEvent = events.find((e) => e.id === selectedEventId) ?? events[0]!;
  const sales = await listWalkInSales(supabase, selectedEventId);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Vendas avulsas</h1>
        <p className="text-sm text-gray-500">{selectedEvent.name} · reenvie o ingresso ou cancele uma venda, se precisar.</p>
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

      <WalkInSalesList sales={sales} appUrl={appUrl} />
    </div>
  );
}
