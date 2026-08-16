"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, signUpSchema, forgotPasswordSchema } from "@/lib/validation/schemas";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function signUpAction(formData: FormData): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { fullName, email, phone, password } = parsed.data;
  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone },
      emailRedirectTo: `${appUrl}/login`,
    },
  });

  if (error) {
    return { ok: false, error: translateAuthError(error.message) };
  }

  return { ok: true };
}

export async function signInAction(formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { ok: false, error: translateAuthError(error.message) };
  }

  return { ok: true };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function forgotPasswordAction(formData: FormData): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "E-mail inválido" };
  }

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appUrl}/atualizar-senha`,
  });

  if (error) {
    return { ok: false, error: translateAuthError(error.message) };
  }

  return { ok: true };
}

export async function updatePasswordAction(formData: FormData): Promise<ActionResult> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    return { ok: false, error: "A senha deve ter pelo menos 8 caracteres" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { ok: false, error: translateAuthError(error.message) };
  }

  return { ok: true };
}

function translateAuthError(message: string): string {
  if (message.includes("Invalid login credentials")) return "E-mail ou senha inválidos";
  if (message.includes("already registered")) return "Este e-mail já possui cadastro";
  if (message.includes("User already registered")) return "Este e-mail já possui cadastro";
  if (message.includes("Password should be at least")) return "A senha é muito curta";
  return "Não foi possível concluir a operação. Tente novamente.";
}
