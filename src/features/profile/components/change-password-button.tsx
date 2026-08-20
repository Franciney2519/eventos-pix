"use client";

import { useTransition } from "react";
import { Loader2, KeyRound } from "lucide-react";
import { adminSendPasswordResetAction } from "@/features/users/actions";
import { useToast } from "@/components/ui/toast";

export function ChangePasswordButton({ email }: { email: string }) {
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
    <button className="btn-secondary w-full" disabled={pending} onClick={send}>
      {pending ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
      Alterar senha
    </button>
  );
}
