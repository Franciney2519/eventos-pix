"use client";

import { TicketStatusBadge } from "@/components/ui/status-badge";
import { CancelTicketButton } from "@/features/tickets/components/cancel-ticket-button";
import { formatDateTime } from "@/lib/format";

export interface TicketRowData {
  id: string;
  ticket_number: string;
  status: string;
  issued_at: string;
  eventName: string | undefined;
  orderNumber: string | undefined;
  participantName: string | undefined;
}

export function TicketsTable({ tickets }: { tickets: TicketRowData[] }) {
  return (
    <div className="card !p-0 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
            <th className="px-5 py-3 font-medium">Ingresso</th>
            <th className="px-5 py-3 font-medium">Participante</th>
            <th className="px-5 py-3 font-medium">Evento</th>
            <th className="px-5 py-3 font-medium">Pedido</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Emitido em</th>
            <th className="px-5 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
              <td className="px-5 py-3 font-mono font-medium text-gray-900">{t.ticket_number}</td>
              <td className="px-5 py-3 text-gray-700">{t.participantName}</td>
              <td className="px-5 py-3 text-gray-700">{t.eventName}</td>
              <td className="px-5 py-3 text-gray-700">{t.orderNumber}</td>
              <td className="px-5 py-3">
                <TicketStatusBadge status={t.status} />
              </td>
              <td className="px-5 py-3 text-gray-500">{formatDateTime(t.issued_at)}</td>
              <td className="px-5 py-3 text-right">
                <CancelTicketButton ticketId={t.id} disabled={t.status !== "AVAILABLE"} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
