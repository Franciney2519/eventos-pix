"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { changeEventStatusAction } from "@/features/events/actions";
import { useToast } from "@/components/ui/toast";
import type { EventStatus } from "@/types/database";

export function EventStatusActions({ eventId, status }: { eventId: string; status: EventStatus }) {
  const router = useRouter();
  const { show } = useToast();
  const [pending, startTransition] = useTransition();

  const change = (next: EventStatus) => {
    startTransition(async () => {
      const result = await changeEventStatusAction(eventId, next as "OPEN" | "CLOSED" | "CANCELLED" | "FINISHED" | "DRAFT");
      if (!result.ok) {
        show(result.error ?? "Não foi possível atualizar o status", "error");
        return;
      }
      show("Status atualizado!", "success");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "OPEN" && status !== "CANCELLED" && status !== "FINISHED" && (
        <button className="btn-secondary" disabled={pending} onClick={() => change("OPEN")}>
          {pending && <Loader2 size={14} className="animate-spin" />} Abrir inscrições
        </button>
      )}
      {status === "OPEN" && (
        <button className="btn-secondary" disabled={pending} onClick={() => change("CLOSED")}>
          {pending && <Loader2 size={14} className="animate-spin" />} Encerrar inscrições
        </button>
      )}
      {status !== "CANCELLED" && status !== "FINISHED" && (
        <button className="btn-danger" disabled={pending} onClick={() => change("CANCELLED")}>
          {pending && <Loader2 size={14} className="animate-spin" />} Cancelar evento
        </button>
      )}
    </div>
  );
}
