"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, MessageCircle, XCircle, Loader2 } from "lucide-react";
import { resendTicketEmailAction, cancelTicketAction } from "@/features/tickets/actions";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { ticketPublicUrl } from "@/lib/tickets/token";
import { useToast } from "@/components/ui/toast";
import { formatDateTime } from "@/lib/format";
import type { WalkInSale } from "@/features/checkin/repository";

export function WalkInSalesList({ sales, appUrl }: { sales: WalkInSale[]; appUrl: string }) {
  const router = useRouter();
  const { show } = useToast();
  const [pending, startTransition] = useTransition();

  const resendEmail = (orderId: string) => {
    startTransition(async () => {
      const result = await resendTicketEmailAction(orderId);
      show(result.ok ? "E-mail reenviado!" : result.error ?? "Erro ao reenviar", result.ok ? "success" : "error");
    });
  };

  const cancel = (ticketId: string) => {
    if (!confirm("Cancelar este ingresso? Essa ação não pode ser desfeita.")) return;
    startTransition(async () => {
      const result = await cancelTicketAction(ticketId);
      show(result.ok ? "Ingresso cancelado" : result.error ?? "Erro ao cancelar", result.ok ? "success" : "error");
      router.refresh();
    });
  };

  if (sales.length === 0) {
    return <p className="text-sm text-gray-500">Nenhuma venda avulsa registrada para este evento ainda.</p>;
  }

  return (
    <div className="card !p-0 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
            <th className="px-5 py-3 font-medium">Comprador</th>
            <th className="px-5 py-3 font-medium">Ingresso</th>
            <th className="px-5 py-3 font-medium">Pagamento</th>
            <th className="px-5 py-3 font-medium">Vendido por</th>
            <th className="px-5 py-3 font-medium">Data</th>
            <th className="px-5 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {sales.map((s) => {
            const whatsappLink =
              s.buyerPhone && s.ticketToken
                ? buildWhatsAppLink(s.buyerPhone, `Olá, ${s.buyerName}! Aqui está seu ingresso: ${ticketPublicUrl(appUrl, s.ticketToken)}`)
                : null;
            const cancelled = s.ticketStatus === "CANCELLED";

            return (
              <tr key={s.orderId} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <td className="px-5 py-3">
                  <p className="font-medium text-gray-900">{s.buyerName}</p>
                  <p className="text-xs text-gray-500">{s.buyerEmail}</p>
                </td>
                <td className="px-5 py-3">
                  <p className="font-mono text-gray-700">{s.ticketNumber ?? "-"}</p>
                  {cancelled && <span className="badge-danger">Cancelado</span>}
                </td>
                <td className="px-5 py-3 text-gray-700">{s.paymentMethod === "PIX" ? "PIX" : "Dinheiro"}</td>
                <td className="px-5 py-3 text-gray-700">{s.soldByName ?? "-"}</td>
                <td className="px-5 py-3 text-gray-500">{formatDateTime(s.createdAt)}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      className="btn-secondary !px-2 !py-1.5 text-xs"
                      disabled={pending}
                      onClick={() => resendEmail(s.orderId)}
                      title="Reenviar por e-mail"
                    >
                      <Mail size={14} />
                    </button>
                    {whatsappLink && (
                      <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary !px-2 !py-1.5 text-xs"
                        title="Reenviar pelo WhatsApp"
                      >
                        <MessageCircle size={14} />
                      </a>
                    )}
                    {s.ticketId && !cancelled && (
                      <button
                        className="btn-secondary !px-2 !py-1.5 text-xs text-danger-600 hover:bg-danger-50"
                        disabled={pending}
                        onClick={() => cancel(s.ticketId!)}
                        title="Cancelar ingresso"
                      >
                        {pending ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
