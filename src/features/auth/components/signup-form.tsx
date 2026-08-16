"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema, type SignUpInput } from "@/lib/validation/schemas";
import { signUpAction } from "@/features/auth/actions";
import { FormField } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import { Loader2 } from "lucide-react";

export function SignUpForm() {
  const router = useRouter();
  const { show } = useToast();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({ resolver: zodResolver(signUpSchema) });

  const onSubmit = (values: SignUpInput) => {
    setServerError(null);
    const formData = new FormData();
    formData.set("fullName", values.fullName);
    formData.set("email", values.email);
    formData.set("phone", values.phone);
    formData.set("password", values.password);
    formData.set("confirmPassword", values.confirmPassword);

    startTransition(async () => {
      const result = await signUpAction(formData);
      if (!result.ok) {
        setServerError(result.error ?? "Não foi possível criar sua conta");
        return;
      }
      show("Conta criada! Verifique seu e-mail para confirmar o cadastro.", "success");
      router.push("/login");
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Nome completo" htmlFor="fullName" error={errors.fullName?.message}>
        <input id="fullName" className="input" placeholder="Seu nome completo" {...register("fullName")} />
      </FormField>
      <FormField label="E-mail" htmlFor="email" error={errors.email?.message}>
        <input id="email" type="email" className="input" placeholder="voce@email.com" {...register("email")} />
      </FormField>
      <FormField label="WhatsApp" htmlFor="phone" error={errors.phone?.message}>
        <input id="phone" className="input" placeholder="(00) 00000-0000" {...register("phone")} />
      </FormField>
      <FormField label="Senha" htmlFor="password" error={errors.password?.message}>
        <input id="password" type="password" className="input" placeholder="Mínimo 8 caracteres" {...register("password")} />
      </FormField>
      <FormField label="Confirmar senha" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
        <input id="confirmPassword" type="password" className="input" placeholder="Repita a senha" {...register("confirmPassword")} />
      </FormField>

      {serverError && <p className="text-sm text-danger-600">{serverError}</p>}

      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending && <Loader2 size={16} className="animate-spin" />}
        Criar conta
      </button>
    </form>
  );
}
