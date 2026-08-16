"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "@/lib/validation/schemas";
import { forgotPasswordAction } from "@/features/auth/actions";
import { FormField } from "@/components/ui/form-field";
import { Loader2, MailCheck } from "lucide-react";

type Input = { email: string };

export function ForgotPasswordForm() {
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Input>({ resolver: zodResolver(forgotPasswordSchema) });

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <div className="rounded-full bg-success-100 p-3">
          <MailCheck size={24} className="text-success-600" />
        </div>
        <p className="text-sm text-gray-600">
          Se houver uma conta com esse e-mail, enviamos um link para redefinir sua senha.
        </p>
      </div>
    );
  }

  const onSubmit = (values: Input) => {
    setServerError(null);
    const formData = new FormData();
    formData.set("email", values.email);

    startTransition(async () => {
      const result = await forgotPasswordAction(formData);
      if (!result.ok) {
        setServerError(result.error ?? "Não foi possível enviar o e-mail");
        return;
      }
      setSent(true);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="E-mail" htmlFor="email" error={errors.email?.message}>
        <input id="email" type="email" className="input" placeholder="voce@email.com" {...register("email")} />
      </FormField>

      {serverError && <p className="text-sm text-danger-600">{serverError}</p>}

      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending && <Loader2 size={16} className="animate-spin" />}
        Enviar link de recuperação
      </button>
    </form>
  );
}
