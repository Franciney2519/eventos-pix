import Image from "next/image";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { createClient } from "@/lib/supabase/server";
import { getEventBySlug, getApprovedTicketQuantity } from "@/features/events/repository";
import { getSessionUser } from "@/lib/auth/session";
import { formatCurrencyBRL, formatEventDate, formatEventTime } from "@/lib/format";
import { OrderFlow } from "@/features/orders/components/order-flow";
import { CountdownTimer } from "@/features/events/components/countdown-timer";

export const dynamic = "force-dynamic";

const ACCENT_COLOR = "#FD3A2D";

export default async function EventDetailPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient();
  const event = await getEventBySlug(supabase, params.slug);
  if (!event || event.status === "DRAFT") notFound();

  const [approved, user] = await Promise.all([
    getApprovedTicketQuantity(supabase, event.id),
    getSessionUser(),
  ]);
  const availableSeats = Math.max(0, event.capacity - approved);
  const eventStartIso = `${event.event_date}T${event.event_time}-04:00`;

  return (
    <>
      <PublicHeader />

      {event.image_url && (
        <div className="flex w-full justify-center" style={{ backgroundColor: ACCENT_COLOR }}>
          <div className="relative aspect-[4/5] w-full max-w-md sm:aspect-[3/4]">
            <Image src={event.image_url} alt={event.name} fill priority className="object-contain" />
          </div>
        </div>
      )}

      <div className="min-h-[60vh] w-full" style={{ backgroundColor: `${ACCENT_COLOR}14` }}>
        <main className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_360px]">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{event.name}</h1>

            <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={16} /> {formatEventDate(event.event_date)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={16} /> {formatEventTime(event.event_time)}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={16} /> {event.location}
              </span>
            </div>

            {event.address && <p className="mt-1 text-sm text-gray-500">{event.address}</p>}

            <div className="mt-6">
              <CountdownTimer targetIso={eventStartIso} accentColor={ACCENT_COLOR} />
            </div>

            {event.description && (
              <div className="card mt-6 whitespace-pre-line text-sm text-gray-700">{event.description}</div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="card !p-4" style={{ borderColor: ACCENT_COLOR }}>
                <p className="text-xs text-gray-400">Valor unitário</p>
                <p className="font-semibold" style={{ color: ACCENT_COLOR }}>
                  {formatCurrencyBRL(event.ticket_price)}
                </p>
              </div>
              <div className="card !p-4">
                <p className="text-xs text-gray-400">Disponíveis</p>
                <p className="font-semibold text-gray-900">{availableSeats}</p>
              </div>
              <div className="card !p-4">
                <p className="text-xs text-gray-400">Capacidade</p>
                <p className="font-semibold text-gray-900">{event.capacity}</p>
              </div>
            </div>
          </div>

          <div>
            <OrderFlow
              event={event}
              availableSeats={availableSeats}
              isLoggedIn={!!user}
              isStaff={!!user && user.profile.role !== "CUSTOMER"}
              accentColor={ACCENT_COLOR}
            />
          </div>
        </main>
      </div>
    </>
  );
}
