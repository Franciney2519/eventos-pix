"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TicketStatusBadge } from "@/components/ui/status-badge";
import { ticketPublicUrl } from "@/lib/tickets/token";
import { formatEventDate, formatEventTime } from "@/lib/format";

export interface PresentableTicket {
  id: string;
  token: string;
  ticket_number: string;
  status: string;
  attendee_name: string | null;
  event_name: string;
  event_date: string;
  event_time: string;
}

export function TicketPresentation({ tickets, appUrl }: { tickets: PresentableTicket[]; appUrl: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const scrollToIndex = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const slide = track.children[index] as HTMLElement | undefined;
    slide?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const index = Array.from(track.children).indexOf(visible.target as HTMLElement);
          if (index >= 0) setActive(index);
        }
      },
      { root: track, threshold: [0.6] }
    );

    Array.from(track.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [tickets.length]);

  if (tickets.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Apresentar na entrada</h2>
          <p className="text-sm text-gray-500">
            {tickets.length > 1 ? "Deslize para o lado para mostrar cada ingresso" : "Mostre este QR code na entrada"}
          </p>
        </div>
        {tickets.length > 1 && (
          <div className="hidden shrink-0 items-center gap-1 sm:flex">
            <button
              type="button"
              onClick={() => scrollToIndex(Math.max(0, active - 1))}
              disabled={active === 0}
              className="btn-secondary !p-2"
              aria-label="Ingresso anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => scrollToIndex(Math.min(tickets.length - 1, active + 1))}
              disabled={active === tickets.length - 1}
              className="btn-secondary !p-2"
              aria-label="Próximo ingresso"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tickets.map((t) => (
          <div
            key={t.id}
            className="card flex w-[86%] shrink-0 snap-center flex-col items-center gap-3 text-center sm:w-[360px]"
          >
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{t.event_name}</p>
              <p className="mt-0.5 text-xs text-gray-500">
                {formatEventDate(t.event_date)} · {formatEventTime(t.event_time)}
              </p>
            </div>

            <div className="flex w-full items-center justify-center rounded-xl border border-gray-200 p-4">
              {t.status === "AVAILABLE" ? (
                <QRCode value={ticketPublicUrl(appUrl, t.token)} size={200} style={{ width: "100%", height: "auto", maxWidth: 220 }} />
              ) : (
                <div className="flex h-[200px] w-[200px] items-center justify-center text-sm text-gray-400">
                  {t.status === "USED" ? "Ingresso já utilizado" : "Ingresso cancelado"}
                </div>
              )}
            </div>

            {t.attendee_name && <p className="font-semibold text-gray-900">{t.attendee_name}</p>}
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-gray-500">{t.ticket_number}</span>
              <TicketStatusBadge status={t.status} />
            </div>
          </div>
        ))}
      </div>

      {tickets.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {tickets.map((t, i) => (
            <button
              key={t.id}
              type="button"
              onClick={() => scrollToIndex(i)}
              aria-label={`Ir para o ingresso ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === active ? "w-5 bg-brand-600" : "w-1.5 bg-gray-300"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
