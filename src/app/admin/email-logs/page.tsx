import Link from "next/link";
import { Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listEmailLogs } from "@/features/email-logs/repository";
import { EmailStatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "all", label: "Todos" },
  { value: "FAILED", label: "Falhas" },
  { value: "SENT", label: "Enviados" },
] as const;

const TYPE_LABELS: Record<string, string> = {
  TICKETS_ISSUED: "Ingressos emitidos",
  ORDER_REJECTED: "Solicitação rejeitada",
  NEW_ORDER_NOTIFICATION: "Nova solicitação (admin)",
};

export default async function AdminEmailLogsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = await createClient();
  const status = searchParams.status && searchParams.status !== "all" ? searchParams.status : undefined;
  const logs = await listEmailLogs(supabase, { status });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">E-mails</h1>
        <p className="text-sm text-gray-500">Histórico de envios — confira aqui quando um e-mail falhar.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/admin/email-logs${f.value === "all" ? "" : `?status=${f.value}`}`}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium ${
              (searchParams.status ?? "all") === f.value
                ? "border-brand-600 bg-brand-50 text-brand-700"
                : "border-gray-200 text-gray-600"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {logs.length === 0 ? (
        <EmptyState icon={Mail} title="Nenhum e-mail encontrado" />
      ) : (
        <div className="card !p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
                <th className="px-5 py-3 font-medium">Data</th>
                <th className="px-5 py-3 font-medium">Tipo</th>
                <th className="px-5 py-3 font-medium">Destinatário</th>
                <th className="px-5 py-3 font-medium">Pedido</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Erro</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3 whitespace-nowrap text-gray-500">{formatDateTime(log.sent_at)}</td>
                  <td className="px-5 py-3 text-gray-700">{TYPE_LABELS[log.type] ?? log.type}</td>
                  <td className="px-5 py-3 text-gray-700">{log.recipient}</td>
                  <td className="px-5 py-3 text-gray-700">
                    {log.orders ? (
                      <Link href={`/admin/solicitacoes/${log.order_id}`} className="text-brand-600 hover:underline">
                        #{log.orders.order_number}
                      </Link>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <EmailStatusBadge status={log.status} />
                  </td>
                  <td className="px-5 py-3 max-w-xs truncate text-danger-600" title={log.error_message ?? undefined}>
                    {log.error_message ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
