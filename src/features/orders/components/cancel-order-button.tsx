"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { XCircle, Loader2 } from "lucide-react";
import { cancelOrderAction } from "@/features/orders/actions";
import { useToast } from "@/components/ui/toast";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { show } = useToast();
  const [pending, startTransition] = useTransition();

  const cancel = () => {
    const reason = prompt("Motivo do cancelamento (ex: pedido duplicado):");
    if (!reason || !reason.trim()) return;
    if (!confirm("Cancelar esta solicitação? Isso cancela o(s) ingresso(s) e libera a vaga.")) return;

    const formData = new FormData();
    formData.set("orderId", orderId);
    formData.set("reason", reason.trim());

    startTransition(async () => {
      const result = await cancelOrderAction(formData);
      show(result.ok ? "Solicitação cancelada" : result.error ?? "Erro ao cancelar", result.ok ? "success" : "error");
      if (result.ok) router.refresh();
    });
  };

  return (
    <button className="btn-secondary text-danger-600 hover:bg-danger-50" disabled={pending} onClick={cancel}>
      {pending ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
      Cancelar solicitação
    </button>
  );
}
