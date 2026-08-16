"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { approveOrderAction, rejectOrderAction } from "@/features/orders/actions";
import { useToast } from "@/components/ui/toast";

export function OrderReviewActions({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { show } = useToast();
  const [pending, startTransition] = useTransition();
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");

  const approve = () => {
    startTransition(async () => {
      const result = await approveOrderAction(orderId);
      if (!result.ok) {
        show(result.error ?? "Não foi possível aprovar", "error");
        return;
      }
      show("Pagamento aprovado! Ingressos emitidos e e-mail enviado.", "success");
      router.refresh();
    });
  };

  const reject = () => {
    if (reason.trim().length < 3) {
      show("Informe o motivo da rejeição", "warning");
      return;
    }
    const formData = new FormData();
    formData.set("orderId", orderId);
    formData.set("reason", reason);

    startTransition(async () => {
      const result = await rejectOrderAction(formData);
      if (!result.ok) {
        show(result.error ?? "Não foi possível rejeitar", "error");
        return;
      }
      show("Pagamento rejeitado.", "success");
      setShowReject(false);
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <button className="btn-primary" disabled={pending} onClick={approve}>
          {pending && <Loader2 size={16} className="animate-spin" />}
          <CheckCircle2 size={16} /> Aprovar pagamento
        </button>
        <button className="btn-danger" disabled={pending} onClick={() => setShowReject((v) => !v)}>
          <XCircle size={16} /> Rejeitar pagamento
        </button>
      </div>

      {showReject && (
        <div className="rounded-xl border border-gray-200 p-4">
          <label className="label" htmlFor="reason">
            Motivo da rejeição
          </label>
          <textarea
            id="reason"
            className="input"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: comprovante ilegível, valor divergente..."
          />
          <button className="btn-danger mt-3" disabled={pending} onClick={reject}>
            {pending && <Loader2 size={16} className="animate-spin" />}
            Confirmar rejeição
          </button>
        </div>
      )}
    </div>
  );
}
