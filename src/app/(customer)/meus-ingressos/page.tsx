import Link from "next/link";
import { Ticket as TicketIcon, QrCode, CalendarDays, Clock, MapPin } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listTicketsForUser } from "@/features/tickets/repository";
import { TicketStatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatEventDate, formatEventTime } from "@/lib/format";
import { TicketPresentation } from "@/features/tickets/components/ticket-presentation";

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const presentable = tickets
    .filter((t) => t.events)
    .map((t) => ({
      id: t.id,
      token: t.token,
      ticket_number: t.ticket_number,
      status: t.status,
      attendee_name: t.attendee_name,
      event_name: t.events!.name,
      event_date: t.events!.event_date,
      event_time: t.events!.event_time,
    }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Meus ingressos</h1>
        <p className="text-sm text-gray-500">Acompanhe seus ingressos e mostre o QR code na entrada do evento.</p>
      </div>

      <TicketPresentation tickets={presentable} appUrl={appUrl} />

      <div>
        <h2 className="mb-3 font-semibold text-gray-900">Detalhes</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tickets.map((t) => (
          <div key={t.id} className="card overflow-hidden !p-0">
            <div className="border-b-2 border-gray-100 bg-gray-100 px-4 py-3 font-semibold text-gray-900">
              {t.events?.name}
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-mono text-[10px] text-gray-400">{t.ticket_number}</p>
                <p className="text-sm font-semibold text-gray-900">{t.attendee_name ?? "Seu ingresso"}</p>
              </div>
              <TicketStatusBadge status={t.status} />
            </div>

            {t.events && (
              <div className="space-y-1 px-4 pb-3 text-xs text-gray-500">
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

            <div className="border-t-2 border-gray-100 p-3">
              <Link href={`/ticket/${t.token}`} className="btn-primary w-full">
                <QrCode size={16} /> Abrir ingresso
              </Link>
            </div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}
