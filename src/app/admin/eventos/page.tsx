import Link from "next/link";
import { Plus, CalendarX } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listAllEvents } from "@/features/events/repository";
import { EventStatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrencyBRL, formatEventDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const supabase = await createClient();
  const events = await listAllEvents(supabase);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Eventos</h1>
          <p className="text-sm text-gray-500">Crie e gerencie os eventos da plataforma.</p>
        </div>
        <Link href="/admin/eventos/novo" className="btn-primary">
          <Plus size={16} /> Novo evento
        </Link>
      </div>

      {events.length === 0 ? (
        <EmptyState icon={CalendarX} title="Nenhum evento cadastrado" description="Crie o primeiro evento para começar a vender ingressos." />
      ) : (
        <div className="card !p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
                <th className="px-5 py-3 font-medium">Nome</th>
                <th className="px-5 py-3 font-medium">Data</th>
                <th className="px-5 py-3 font-medium">Capacidade</th>
                <th className="px-5 py-3 font-medium">Preço</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <Link href={`/admin/eventos/${e.id}`} className="font-medium text-brand-600 hover:underline">
                      {e.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-700">{formatEventDate(e.event_date)}</td>
                  <td className="px-5 py-3 text-gray-700">{e.capacity}</td>
                  <td className="px-5 py-3 text-gray-700">{formatCurrencyBRL(e.ticket_price)}</td>
                  <td className="px-5 py-3">
                    <EventStatusBadge status={e.status} />
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
