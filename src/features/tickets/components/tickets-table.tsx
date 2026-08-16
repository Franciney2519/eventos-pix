"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IdCard } from "lucide-react";
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
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const selectable = tickets.filter((t) => t.status !== "CANCELLED");
  const allSelected = selectable.length > 0 && selectable.every((t) => selected.has(t.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectable.map((t) => t.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const generateBadges = () => {
    if (selected.size === 0) return;
    router.push(`/imprimir/crachas?ids=${Array.from(selected).join(",")}`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{selected.size} selecionado(s)</p>
        <button className="btn-primary" disabled={selected.size === 0} onClick={generateBadges}>
          <IdCard size={16} /> Gerar crachás
        </button>
      </div>

      <div className="card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
              <th className="w-10 px-5 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Selecionar todos" />
              </th>
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
                <td className="px-5 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(t.id)}
                    disabled={t.status === "CANCELLED"}
                    onChange={() => toggleOne(t.id)}
                    aria-label={`Selecionar ${t.ticket_number}`}
                  />
                </td>
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
    </div>
  );
}
