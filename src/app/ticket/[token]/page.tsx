import { notFound } from "next/navigation";
import { CalendarDays, Clock, MapPin, XCircle, CheckCircle2 } from "lucide-react";
import QRCode from "react-qr-code";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatEventDate, formatEventTime } from "@/lib/format";
import { ticketPublicUrl } from "@/lib/tickets/token";
import { TicketStatusBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";

export default async function TicketPage({ params }: { params: { token: string } }) {
  const admin = createAdminClient();
  const { data: ticket } = await admin
    .from("tickets")
    .select("*, events(name, event_date, event_time, location)")
    .eq("token", params.token)
    .maybeSingle();

  if (!ticket) notFound();

  const event = (ticket as unknown as { events: { name: string; event_date: string; event_time: string; location: string } }).events;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Ingresso</p>
          <h1 className="mt-1 text-xl font-semibold text-gray-900">{event.name}</h1>
        </div>

        <div className="mt-5 space-y-1.5 text-center text-sm text-gray-600">
          <p className="flex items-center justify-center gap-1.5">
            <CalendarDays size={14} /> {formatEventDate(event.event_date)}
          </p>
          <p className="flex items-center justify-center gap-1.5">
            <Clock size={14} /> {formatEventTime(event.event_time)}
          </p>
          <p className="flex items-center justify-center gap-1.5">
            <MapPin size={14} /> {event.location}
          </p>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          {ticket.status === "AVAILABLE" && (
            <div className="rounded-xl border border-gray-200 p-3">
              <QRCode value={ticketPublicUrl(appUrl, ticket.token)} size={180} />
            </div>
          )}
          {ticket.status === "USED" && (
            <div className="flex flex-col items-center gap-2 rounded-xl bg-gray-50 p-8">
              <CheckCircle2 size={40} className="text-gray-400" />
              <p className="text-sm font-medium text-gray-600">Ingresso já utilizado</p>
            </div>
          )}
          {ticket.status === "CANCELLED" && (
            <div className="flex flex-col items-center gap-2 rounded-xl bg-danger-50 p-8">
              <XCircle size={40} className="text-danger-500" />
              <p className="text-sm font-medium text-danger-600">Ingresso cancelado</p>
            </div>
          )}

          {ticket.attendee_name && (
            <p className="text-sm font-semibold text-gray-900">{ticket.attendee_name}</p>
          )}
          <p className="font-mono text-sm font-medium text-gray-900">{ticket.ticket_number}</p>
          <TicketStatusBadge status={ticket.status} />
        </div>
      </div>
    </main>
  );
}
