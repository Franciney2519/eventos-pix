"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export interface AdminContact {
  id: string;
  fullName: string;
  phone: string;
}

/**
 * Public — any visitor (including logged-out ones browsing /eventos) can
 * see who to ask a question to. Regular users can't read other profiles
 * under RLS, so this deliberately uses the service-role client, but only
 * ever returns name + phone for admins who have a phone on file.
 */
export async function getAdminContactsAction(): Promise<AdminContact[]> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("profiles")
    .select("id, full_name, phone")
    .eq("role", "ADMIN")
    .not("phone", "is", null);

  if (error || !data) return [];

  return data
    .filter((p): p is { id: string; full_name: string; phone: string } => !!p.phone && p.phone.trim().length > 0)
    .map((p) => ({ id: p.id, fullName: p.full_name, phone: p.phone }));
}
