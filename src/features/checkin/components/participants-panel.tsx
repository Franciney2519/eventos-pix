"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Loader2, Mail, Phone, User, X } from "lucide-react";
import clsx from "clsx";
import { toManausDateKey } from "@/lib/checkin/timezone";
import { useToast } from "@/components/ui/toast";
import type { ParticipantForCheckin } from "@/features/checkin/repository";

export function ParticipantsPanel({
  participants,
  day1Key,
  day2Key,
  day1Label,
  day2Label,
}: {
  participants: ParticipantForCheckin[];
  day1Key: string;
  day2Key: string;
  day1Label: string;
  day2Label: string;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ParticipantForCheckin | null>(null);

  const rows = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return participants
      .map((p) => ({
        ...p,
        day1CheckedInAt: p.checkins.find((c) => toManausDateKey(c.checkedInAt) === day1Key)?.checkedInAt ?? null,
        day2CheckedInAt: p.checkins.find((c) => toManausDateKey(c.checkedInAt) === day2Key)?.checkedInAt ?? null,
      }))
      .filter((p) => {
        if (!trimmed) return true;
        return [p.participantName, p.participantEmail, p.ticketNumber, p.orderNumber].join(" ").toLowerCase().includes(trimmed);
      });
  }, [participants, query, day1Key, day2Key]);

  return (
    <div className="space-y-4">
      <input
        className="input max-w-md"
        placeholder="Buscar por nome, e-mail ou número do ingresso"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
              <th className="px-5 py-3 font-medium">Participante</th>
              <th className="px-5 py-3 font-medium">Ingresso</th>
              <th className="px-5 py-3 font-medium">{day1Label}</th>
              <th className="px-5 py-3 font-medium">{day2Label}</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <td className="px-5 py-3">
                  <p className="font-medium text-gray-900">{p.participantName}</p>
                  <p className="text-xs text-gray-500">{p.participantEmail}</p>
                </td>
                <td className="px-5 py-3 font-mono text-gray-700">{p.ticketNumber}</td>
                <td className="px-5 py-3">
                  <DayStatus status={p.status} checkedInAt={p.day1CheckedInAt} />
                </td>
                <td className="px-5 py-3">
                  <DayStatus status={p.status} checkedInAt={p.day2CheckedInAt} />
                </td>
                <td className="px-5 py-3 text-right">
                  <button className="text-sm text-brand-600 hover:underline" onClick={() => setSelected(p)}>
                    Ver detalhes
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">
                  Nenhum participante encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <ParticipantDetailModal
          participant={selected}
          day1Key={day1Key}
          day2Key={day2Key}
          day1Label={day1Label}
          day2Label={day2Label}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function DayStatus({ status, checkedInAt }: { status: string; checkedInAt: string | null }) {
  if (status === "CANCELLED") {
    return <span className="badge-danger">Cancelado</span>;
  }
  if (checkedInAt) {
    return (
      <span className="badge-success">
        <CheckCircle2 size={12} /> {new Date(checkedInAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
      </span>
    );
  }
  return <span className="badge-gray">Pendente</span>;
}

function ParticipantDetailModal({
  participant,
  day1Key,
  day2Key,
  day1Label,
  day2Label,
  onClose,
}: {
  participant: ParticipantForCheckin;
  day1Key: string;
  day2Key: string;
  day1Label: string;
  day2Label: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [pending, startTransition] = useTransition();

  const todayKey = toManausDateKey(new Date().toISOString());
  const isEventDay = todayKey === day1Key || todayKey === day2Key;
  const checkedInToday = participant.checkins.some((c) => toManausDateKey(c.checkedInAt) === todayKey);
  const canConfirm = participant.status !== "CANCELLED" && isEventDay && !checkedInToday;

  const confirm = () => {
    startTransition(async () => {
      const res = await fetch("/api/checkin/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: participant.id, source: "MANUAL" }),
      });
      const data = await res.json();
      if (!data.ok || !data.success) {
        show(data.message === "ALREADY_CHECKED_IN_TODAY" ? "Check-in já feito hoje" : "Não foi possível confirmar entrada", "error");
        return;
      }
      show(`Entrada confirmada — ${data.ticketNumber}`, "success");
      onClose();
      router.refresh();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-t-2xl bg-white p-6 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <h2 className="font-semibold text-gray-900">Detalhes do participante</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <p className="flex items-center gap-2 text-gray-700">
            <User size={14} className="shrink-0 text-gray-400" /> {participant.participantName}
          </p>
          <p className="flex items-center gap-2 text-gray-700">
            <Mail size={14} className="shrink-0 text-gray-400" /> {participant.participantEmail}
          </p>
          {participant.participantPhone && (
            <p className="flex items-center gap-2 text-gray-700">
              <Phone size={14} className="shrink-0 text-gray-400" /> {participant.participantPhone}
            </p>
          )}
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs text-gray-400">Ingresso</p>
            <p className="font-mono text-gray-900">{participant.ticketNumber}</p>
            <p className="text-xs text-gray-400">Pedido {participant.orderNumber}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
            <div>
              <p className="text-xs text-gray-400">{day1Label}</p>
              <DayStatus status={participant.status} checkedInAt={participant.checkins.find((c) => toManausDateKey(c.checkedInAt) === day1Key)?.checkedInAt ?? null} />
            </div>
            <div>
              <p className="text-xs text-gray-400">{day2Label}</p>
              <DayStatus status={participant.status} checkedInAt={participant.checkins.find((c) => toManausDateKey(c.checkedInAt) === day2Key)?.checkedInAt ?? null} />
            </div>
          </div>
        </div>

        <button
          className={clsx("mt-5 w-full", canConfirm ? "btn-primary" : "btn-secondary")}
          disabled={!canConfirm || pending}
          onClick={confirm}
        >
          {pending && <Loader2 size={16} className="animate-spin" />}
          {!isEventDay ? (
            <>
              <Clock size={16} /> Fora dos dias do evento
            </>
          ) : checkedInToday ? (
            "Já confirmado hoje"
          ) : (
            "Confirmar entrada hoje"
          )}
        </button>
      </div>
    </div>
  );
}
