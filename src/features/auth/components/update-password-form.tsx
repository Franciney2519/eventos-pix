"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePasswordAction } from "@/features/auth/actions";
import { useToast } from "@/components/ui/toast";
import { Loader2 } from "lucide-react";

export function UpdatePasswordForm() {
  const router = useRouter();
  const { show } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem");
      return;
    }

    const formData = new FormData();
    formData.set("password", password);

    startTransition(async () => {
      const result = await updatePasswordAction(formData);
      if (!result.ok) {
        setError(result.error ?? "Não foi possível atualizar a senha");
        return;
      }
      show("Senha atualizada com sucesso!", "success");
      router.push("/login");
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="password">
          Nova senha
        </label>
        <input
          id="password"
          type="password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 8 caracteres"
        />
      </div>
      <div>
        <label className="label" htmlFor="confirm">
          Confirmar nova senha
        </label>
        <input
          id="confirm"
          type="password"
          className="input"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repita a senha"
        />
      </div>
      {error && <p className="text-sm text-danger-600">{error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending && <Loader2 size={16} className="animate-spin" />}
        Atualizar senha
      </button>
    </form>
  );
}
