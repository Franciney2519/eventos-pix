"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CameraIcon, CheckCircle2, Loader2, Mail, Phone, Search, User, XCircle, AlertTriangle } from "lucide-react";
import { QrScanner } from "./qr-scanner";
import { extractTokenFromScan } from "@/lib/checkin/extract-token";
import { useToast } from "@/components/ui/toast";

interface ScanResult {
  outcome: "OK" | "TICKET_NOT_FOUND" | "ALREADY_CHECKED_IN_TODAY" | "TICKET_CANCELLED";
  ticket?: {
    id: string;
    ticketNumber: string;
    status: string;
    lastCheckedInAt: string | null;
    orderNumber: string | null;
    participantName: string | null;
    participantEmail: string | null;
    participantPhone: string | null;
  };
}

interface SearchResult {
  id: string;
  ticketNumber: string;
  status: string;
  orderNumber: string;
  participantName: string;
  alreadyCheckedInToday: boolean;
}

interface RecentCheckin {
  id: string;
  ticketNumber: string;
  participantName: string;
  checkedInAt: string;
  source: string;
}

export function CheckinPanel({
  eventId,
  checkedIn,
  approvedTickets,
  recentCheckins,
}: {
  eventId: string;
  checkedIn: number;
  approvedTickets: number;
  recentCheckins: RecentCheckin[];
}) {
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
        show(data.message === "ALREADY_CHECKED_IN_TODAY" ? "Check-in já feito hoje para este ingresso" : "Não foi possível confirmar entrada", "error");
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

  const percent = approvedTickets > 0 ? Math.min(100, Math.round((checkedIn / approvedTickets) * 100)) : 0;

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="grid grid-cols-2 gap-3">
          <div className="border-2 border-gray-200 bg-gray-50 p-3">
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Confirmados hoje</p>
            <p className="text-lg font-bold text-brand-600">{checkedIn}</p>
          </div>
          <div className="border-2 border-gray-200 bg-gray-50 p-3">
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Total de ingressos</p>
            <p className="text-lg font-bold text-gray-900">{approvedTickets}</p>
          </div>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden bg-gray-200">
          <div className="h-full bg-brand-600 transition-all" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-1.5 text-[10px] text-gray-500">{percent}% check-in realizado hoje</p>

        {!scanning && (
          <button className="btn-primary mt-4 w-full" onClick={() => { setScanning(true); setResult(null); }}>
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
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-100 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{t.participantName}</p>
                  <p className="text-xs text-gray-500">
                    {t.ticketNumber} · Pedido {t.orderNumber}
                  </p>
                </div>
                {t.status === "CANCELLED" ? (
                  <span className="text-xs text-gray-400">Cancelado</span>
                ) : t.alreadyCheckedInToday ? (
                  <span className="text-xs text-gray-400">Já fez check-in hoje</span>
                ) : (
                  <button className="btn-secondary !px-3 !py-1.5 text-xs" disabled={pending} onClick={() => confirmEntry(t.id, "MANUAL")}>
                    Registrar check-in
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {recentCheckins.length > 0 && (
        <div className="card space-y-3">
          <h2 className="font-semibold text-gray-900">Últimos check-ins</h2>
          <div className="grid gap-2">
            {recentCheckins.map((c) => (
              <div key={c.id} className="border-l-2 border-brand-600 bg-gray-50 p-3">
                <span className="float-right text-xs font-semibold text-brand-600">✓</span>
                <p className="text-sm font-semibold text-gray-900">{c.participantName}</p>
                <p className="text-xs text-gray-500">
                  {c.ticketNumber} · {new Date(c.checkedInAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  {c.source === "MANUAL" ? " · manual" : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
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
        <ParticipantInfo ticket={result.ticket} />
      </div>
    );
  }

  if (result.outcome === "ALREADY_CHECKED_IN_TODAY") {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <AlertTriangle size={36} className="text-danger-500" />
        <p className="font-semibold text-danger-600">Check-in já feito hoje</p>
        <ParticipantInfo ticket={result.ticket} />
        {result.ticket?.lastCheckedInAt && (
          <p className="text-xs text-gray-400">Entrada às {new Date(result.ticket.lastCheckedInAt).toLocaleTimeString("pt-BR")}</p>
        )}
        <p className="text-xs text-gray-400">Válido novamente amanhã, se o evento continuar.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <CheckCircle2 size={36} className="text-success-600" />
      <p className="font-semibold text-success-700">Ingresso válido</p>
      <ParticipantInfo ticket={result.ticket} />
      <button className="btn-primary" disabled={pending} onClick={() => result.ticket && onConfirm(result.ticket.id)}>
        {pending && <Loader2 size={16} className="animate-spin" />}
        Confirmar entrada
      </button>
    </div>
  );
}

function ParticipantInfo({ ticket }: { ticket: ScanResult["ticket"] }) {
  if (!ticket) return null;

  return (
    <div className="w-full max-w-xs rounded-xl bg-gray-50 p-4 text-left">
      {ticket.participantName && (
        <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <User size={14} className="shrink-0 text-gray-400" /> {ticket.participantName}
        </p>
      )}
      {ticket.participantEmail && (
        <p className="mt-1 flex items-center gap-2 text-xs text-gray-500">
          <Mail size={12} className="shrink-0 text-gray-400" /> {ticket.participantEmail}
        </p>
      )}
      {ticket.participantPhone && (
        <p className="mt-1 flex items-center gap-2 text-xs text-gray-500">
          <Phone size={12} className="shrink-0 text-gray-400" /> {ticket.participantPhone}
        </p>
      )}
      <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2 text-xs text-gray-400">
        <span className="font-mono">{ticket.ticketNumber}</span>
        <span>Pedido {ticket.orderNumber}</span>
      </div>
    </div>
  );
}
