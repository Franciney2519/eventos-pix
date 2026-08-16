import Link from "next/link";
import { Ticket as TicketIcon, QrCode, CalendarDays, Clock, MapPin } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listTicketsForUser } from "@/features/tickets/repository";
import { TicketStatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatEventDate, formatEventTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MyTicketsPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const tickets = await listTicketsForUser(supabase, user.id);

  if (tickets.length === 0) {
    return (
      <EmptyState
        icon={TicketIcon}
        title="Você ainda não tem ingressos"
        description="Assim que uma compra for aprovada, seus ingressos aparecerão aqui."
        action={
          <Link href="/eventos" className="btn-primary">
            Ver eventos
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Meus ingressos</h1>
        <p className="text-sm text-gray-500">Acesse individualmente o QR Code de cada ingresso.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tickets.map((t) => (
          <div key={t.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">{t.events?.name}</p>
                <p className="font-mono text-xs text-gray-400">{t.ticket_number}</p>
              </div>
              <TicketStatusBadge status={t.status} />
            </div>

            {t.events && (
              <div className="mt-3 space-y-1 text-xs text-gray-500">
                <p className="flex items-center gap-1.5">
                  <CalendarDays size={12} /> {formatEventDate(t.events.event_date)}
                </p>
                <p className="flex items-center gap-1.5">
                  <Clock size={12} /> {formatEventTime(t.events.event_time)}
                </p>
                <p className="flex items-center gap-1.5">
                  <MapPin size={12} /> {t.events.location}
                </p>
              </div>
            )}

            <Link href={`/ticket/${t.token}`} className="btn-primary mt-4 w-full">
              <QrCode size={16} /> Abrir ingresso
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
