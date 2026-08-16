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
