"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import type { ActionResult } from "@/features/auth/actions";

export async function updateProfileAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (fullName.length < 3) {
    return { ok: false, error: "Informe seu nome completo" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone })
    .eq("user_id", user.id);

  if (error) return { ok: false, error: "Não foi possível atualizar seu perfil" };

  revalidatePath("/minha-conta");
  return { ok: true };
}
