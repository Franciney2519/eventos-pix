"use client";

import QRCode from "react-qr-code";
import { Printer } from "lucide-react";
import { ticketPublicUrl } from "@/lib/tickets/token";
import type { TicketForBadge } from "@/features/tickets/repository";

// Coordinates measured against the 1024x1536px (10cm x 15cm @ 102.4px/cm)
// template in public/badges/identidade-template.png. Tweak these if the
// artwork changes.
const NAME_TOP_CM = 9.0;
const NAME_LEFT_CM = 1.8;
const NAME_WIDTH_CM = 7.0;
const QR_TOP_CM = 9.95;
const QR_LEFT_CM = 3.8;
const QR_SIZE_CM = 2.4;

export function BadgeSheet({ tickets, appUrl }: { tickets: TicketForBadge[]; appUrl: string }) {
  return (
    <div>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          .badge-page { page-break-after: always; }
          .badge-page:last-child { page-break-after: auto; }
        }
        @page {
          size: 100mm 150mm;
          margin: 0;
        }
      `}</style>

      <div className="no-print mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-500">{tickets.length} crachá(s) prontos para impressão (100mm x 150mm)</p>
        <button className="btn-primary" onClick={() => window.print()}>
          <Printer size={16} /> Imprimir
        </button>
      </div>

      <div className="flex flex-col items-center gap-6 print:gap-0">
        {tickets.map((t) => (
          <div
            key={t.id}
            className="badge-page relative overflow-hidden bg-gray-900 shadow-lg print:shadow-none"
            style={{
              width: "100mm",
              height: "150mm",
              backgroundImage: "url(/badges/identidade-template.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div
              className="absolute flex items-center overflow-hidden text-ellipsis whitespace-nowrap font-semibold uppercase tracking-wide text-gray-900"
              style={{
                top: `${NAME_TOP_CM}cm`,
                left: `${NAME_LEFT_CM}cm`,
                width: `${NAME_WIDTH_CM}cm`,
                fontSize: "3.2mm",
              }}
            >
              {t.participant_name}
            </div>

            <div
              className="absolute flex items-center justify-center bg-white p-[2mm]"
              style={{
                top: `${QR_TOP_CM}cm`,
                left: `${QR_LEFT_CM}cm`,
                width: `${QR_SIZE_CM}cm`,
                height: `${QR_SIZE_CM}cm`,
              }}
            >
              <QRCode value={ticketPublicUrl(appUrl, t.token)} size={256} style={{ width: "100%", height: "100%" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
