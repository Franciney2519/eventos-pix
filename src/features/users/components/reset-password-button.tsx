"use client";

import { useTransition } from "react";
import { Loader2, KeyRound } from "lucide-react";
import { adminSendPasswordResetAction } from "@/features/users/actions";
import { useToast } from "@/components/ui/toast";

export function ResetPasswordButton({ email }: { email: string }) {
  const { show } = useToast();
  const [pending, startTransition] = useTransition();

  const send = () => {
    startTransition(async () => {
      const result = await adminSendPasswordResetAction(email);
      if (!result.ok) {
        show(result.error ?? "Não foi possível enviar o e-mail", "error");
        return;
      }
      show(`Link de redefinição enviado para ${email}`, "success");
    });
  };

  return (
    <button className="btn-ghost !px-2 !py-1 text-xs" disabled={pending} onClick={send}>
      {pending ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
      Redefinir senha
    </button>
  );
}
