import Link from "next/link";
import Image from "next/image";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import type { EventRow } from "@/types/database";
import { formatCurrencyBRL, formatEventDate, formatEventTime } from "@/lib/format";
import { EventStatusBadge } from "@/components/ui/status-badge";

export function EventCard({ event, availableSeats }: { event: EventRow; availableSeats: number }) {
  const soldOut = availableSeats <= 0;

  return (
    <div className="card flex flex-col overflow-hidden !p-0">
      <div className="relative h-40 w-full bg-gray-100">
        {event.image_url ? (
          <Image src={event.image_url} alt={event.name} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-300">
            <CalendarDays size={32} />
          </div>
        )}
        <div className="absolute right-3 top-3">
          <EventStatusBadge status={event.status} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-semibold text-gray-900">{event.name}</h3>

        <div className="mt-2 space-y-1 text-sm text-gray-500">
          <p className="flex items-center gap-1.5">
            <CalendarDays size={14} /> {formatEventDate(event.event_date)}
          </p>
          <p className="flex items-center gap-1.5">
            <Clock size={14} /> {formatEventTime(event.event_time)}
          </p>
          <p className="flex items-center gap-1.5">
            <MapPin size={14} /> {event.location}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">A partir de</p>
            <p className="font-semibold text-gray-900">{formatCurrencyBRL(event.ticket_price)}</p>
          </div>
          <p className="text-xs text-gray-500">
            {soldOut ? "Esgotado" : `${availableSeats} vaga(s)`}
          </p>
        </div>

        <Link
          href={`/eventos/${event.slug}`}
          className="btn-primary mt-4 w-full"
          aria-disabled={soldOut}
        >
          {soldOut ? "Ver evento" : "Ver evento"}
        </Link>
      </div>
    </div>
  );
}
