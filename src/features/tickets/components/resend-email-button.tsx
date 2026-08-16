"use client";

import { useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { resendTicketEmailAction } from "@/features/tickets/actions";
import { useToast } from "@/components/ui/toast";

export function ResendEmailButton({ orderId }: { orderId: string }) {
  const { show } = useToast();
  const [pending, startTransition] = useTransition();

  const resend = () => {
    startTransition(async () => {
      const result = await resendTicketEmailAction(orderId);
      if (!result.ok) {
        show(result.error ?? "Não foi possível reenviar", "error");
        return;
      }
      show("E-mail reenviado com sucesso!", "success");
    });
  };

  return (
    <button className="btn-secondary !px-3 !py-1.5 text-xs" disabled={pending} onClick={resend}>
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
      Reenviar e-mail
    </button>
  );
}
