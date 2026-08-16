"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Ban } from "lucide-react";
import { cancelTicketAction } from "@/features/tickets/actions";
import { useToast } from "@/components/ui/toast";

export function CancelTicketButton({ ticketId, disabled }: { ticketId: string; disabled?: boolean }) {
  const router = useRouter();
  const { show } = useToast();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (disabled) {
    return (
      <button className="btn-ghost !px-2 !py-1 text-xs opacity-40" disabled>
        <Ban size={14} /> Cancelar
      </button>
    );
  }

  if (!confirming) {
    return (
      <button className="btn-ghost !px-2 !py-1 text-xs text-danger-600" onClick={() => setConfirming(true)}>
        <Ban size={14} /> Cancelar
      </button>
    );
  }

  const confirm = () => {
    startTransition(async () => {
      const result = await cancelTicketAction(ticketId);
      if (!result.ok) {
        show(result.error ?? "Não foi possível cancelar", "error");
        setConfirming(false);
        return;
      }
      show("Ingresso cancelado.", "success");
      router.refresh();
    });
  };

  return (
    <span className="flex items-center gap-1 text-xs">
      Confirmar?
      <button className="font-medium text-danger-600" disabled={pending} onClick={confirm}>
        {pending ? <Loader2 size={12} className="animate-spin" /> : "Sim"}
      </button>
      <button className="text-gray-400" onClick={() => setConfirming(false)}>
        Não
      </button>
    </span>
  );
}
