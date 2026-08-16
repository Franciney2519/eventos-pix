"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CameraIcon, CheckCircle2, Loader2, Search, XCircle, AlertTriangle } from "lucide-react";
import { QrScanner } from "./qr-scanner";
import { extractTokenFromScan } from "@/lib/checkin/extract-token";
import { useToast } from "@/components/ui/toast";

interface ScanResult {
  outcome: "OK" | "TICKET_NOT_FOUND" | "TICKET_ALREADY_USED" | "TICKET_CANCELLED";
  ticket?: { id: string; ticketNumber: string; status: string; usedAt: string | null; orderNumber: string | null };
}

interface SearchResult {
  id: string;
  ticketNumber: string;
  status: string;
  orderNumber: string;
  participantName: string;
}

export function CheckinPanel({ eventId, checkedIn, approvedTickets }: { eventId: string; checkedIn: number; approvedTickets: number }) {
  const router = useRouter();
  const { show } = useToast();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [pending, startTransition] = useTransition();

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const handleDecode = (text: string) => {
    setScanning(false);
    const token = extractTokenFromScan(text);
    startTransition(async () => {
      const res = await fetch("/api/checkin/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, eventId }),
      });
      const data = await res.json();
      if (!data.ok) {
        show("Erro ao validar ingresso", "error");
        return;
      }
      setResult({ outcome: data.outcome, ticket: data.ticket });
    });
  };

  const confirmEntry = (ticketId: string, source: "QR" | "MANUAL") => {
    startTransition(async () => {
      const res = await fetch("/api/checkin/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, source }),
      });
      const data = await res.json();
      if (!data.ok || !data.success) {
        show(data.message === "TICKET_ALREADY_USED" ? "Ingresso já utilizado" : "Não foi possível confirmar entrada", "error");
        return;
      }
      show(`Entrada confirmada — ${data.ticketNumber}`, "success");
      setResult(null);
      setSearchResults((prev) => prev.filter((t) => t.id !== ticketId));
      router.refresh();
    });
  };

  const runSearch = async (q: string) => {
    setQuery(q);
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/checkin/search?eventId=${eventId}&q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data.results ?? []);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card flex items-center justify-between">
        <div>
          <p className="text-2xl font-semibold text-gray-900">
            {checkedIn} / {approvedTickets}
          </p>
          <p className="text-sm text-gray-500">presentes</p>
        </div>
        {!scanning && (
          <button className="btn-primary" onClick={() => { setScanning(true); setResult(null); }}>
            <CameraIcon size={16} /> Abrir scanner
          </button>
        )}
      </div>

      {scanning && (
        <div className="card">
          <QrScanner onDecode={handleDecode} onClose={() => setScanning(false)} />
        </div>
      )}

      {pending && !result && (
        <div className="card flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-gray-400" />
        </div>
      )}

      {result && (
        <div className="card">
          <ScanResultView result={result} onConfirm={(id) => confirmEntry(id, "QR")} pending={pending} />
        </div>
      )}

      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900">Buscar participante</h2>
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Nome, e-mail, número do ingresso ou do pedido"
            value={query}
            onChange={(e) => runSearch(e.target.value)}
          />
        </div>

        {searching && <p className="text-sm text-gray-400">Buscando...</p>}

        {searchResults.length > 0 && (
          <ul className="space-y-2">
            {searchResults.map((t) => (
              <li key={t.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{t.participantName}</p>
                  <p className="text-xs text-gray-500">
                    {t.ticketNumber} · Pedido {t.orderNumber}
                  </p>
                </div>
                {t.status === "AVAILABLE" ? (
                  <button className="btn-secondary !px-3 !py-1.5 text-xs" disabled={pending} onClick={() => confirmEntry(t.id, "MANUAL")}>
                    Registrar check-in
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">{t.status === "USED" ? "Já utilizado" : "Cancelado"}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ScanResultView({
  result,
  onConfirm,
  pending,
}: {
  result: ScanResult;
  onConfirm: (ticketId: string) => void;
  pending: boolean;
}) {
  if (result.outcome === "TICKET_NOT_FOUND") {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <XCircle size={36} className="text-danger-500" />
        <p className="font-semibold text-danger-600">Ingresso inválido</p>
      </div>
    );
  }

  if (result.outcome === "TICKET_CANCELLED") {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <XCircle size={36} className="text-danger-500" />
        <p className="font-semibold text-danger-600">Ingresso cancelado</p>
        <p className="font-mono text-sm text-gray-500">{result.ticket?.ticketNumber}</p>
      </div>
    );
  }

  if (result.outcome === "TICKET_ALREADY_USED") {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <AlertTriangle size={36} className="text-danger-500" />
        <p className="font-semibold text-danger-600">Ingresso já utilizado</p>
        <p className="font-mono text-sm text-gray-500">{result.ticket?.ticketNumber}</p>
        {result.ticket?.usedAt && <p className="text-xs text-gray-400">Entrada às {new Date(result.ticket.usedAt).toLocaleTimeString("pt-BR")}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <CheckCircle2 size={36} className="text-success-600" />
      <p className="font-semibold text-success-700">Ingresso válido</p>
      <p className="font-mono text-sm text-gray-700">{result.ticket?.ticketNumber}</p>
      <p className="text-xs text-gray-400">Pedido {result.ticket?.orderNumber}</p>
      <button className="btn-primary" disabled={pending} onClick={() => result.ticket && onConfirm(result.ticket.id)}>
        {pending && <Loader2 size={16} className="animate-spin" />}
        Confirmar entrada
      </button>
    </div>
  );
}
