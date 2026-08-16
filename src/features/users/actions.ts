"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import type { UserRole } from "@/types/database";
import type { ActionResult } from "@/features/auth/actions";

export async function changeUserRoleAction(profileId: string, role: UserRole): Promise<ActionResult> {
  await requireRole("ADMIN");
  const supabase = await createClient();

  const { error } = await supabase.from("profiles").update({ role }).eq("id", profileId);
  if (error) return { ok: false, error: "Não foi possível atualizar o papel do usuário" };

  revalidatePath("/admin/usuarios");
  return { ok: true };
}

/**
 * Lets an admin trigger a password-reset email for a user who can't do it
 * themselves (e.g. lost access to their own inbox login but reachable by
 * another channel). Sends the same Supabase recovery email as /esqueci-senha
 * — there is no way to set a password directly without the user completing
 * that link, by design.
 */
export async function adminSendPasswordResetAction(email: string): Promise<ActionResult> {
  await requireRole("ADMIN");
  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/atualizar-senha`,
  });

  if (error) return { ok: false, error: "Não foi possível enviar o e-mail de redefinição" };
  return { ok: true };
}
