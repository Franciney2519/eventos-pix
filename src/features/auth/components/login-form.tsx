"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validation/schemas";
import { signInAction } from "@/features/auth/actions";
import { FormField } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { show } = useToast();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (values: LoginInput) => {
    setServerError(null);
    const formData = new FormData();
    formData.set("email", values.email);
    formData.set("password", values.password);

    startTransition(async () => {
      const result = await signInAction(formData);
      if (!result.ok) {
        setServerError(result.error ?? "Não foi possível entrar");
        return;
      }
      show("Login realizado com sucesso!", "success");
      router.push(params.get("redirect") || "/minha-conta");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="E-mail" htmlFor="email" error={errors.email?.message}>
        <input id="email" type="email" className="input" placeholder="voce@email.com" {...register("email")} />
      </FormField>
      <FormField label="Senha" htmlFor="password" error={errors.password?.message}>
        <input id="password" type="password" className="input" placeholder="••••••••" {...register("password")} />
      </FormField>

      {serverError && <p className="text-sm text-danger-600">{serverError}</p>}

      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending && <Loader2 size={16} className="animate-spin" />}
        Entrar
      </button>
    </form>
  );
}
