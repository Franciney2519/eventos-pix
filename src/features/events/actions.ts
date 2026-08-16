"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { eventSchema } from "@/lib/validation/schemas";
import { createEvent, updateEvent } from "./repository";
import type { ActionResult } from "@/features/auth/actions";

function parseEventForm(formData: FormData) {
  return eventSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") || null,
    event_date: formData.get("event_date"),
    event_time: formData.get("event_time"),
    location: formData.get("location"),
    address: formData.get("address") || null,
    capacity: formData.get("capacity"),
    ticket_price: formData.get("ticket_price"),
    max_tickets_per_order: formData.get("max_tickets_per_order") || 6,
    pix_key: formData.get("pix_key"),
    pix_holder_name: formData.get("pix_holder_name"),
    image_url: formData.get("image_url") || "",
    status: formData.get("status"),
  });
}

export async function createEventAction(formData: FormData): Promise<ActionResult & { id?: string }> {
  await requireRole("ADMIN");
  const parsed = parseEventForm(formData);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  try {
    const event = await createEvent(supabase, {
      ...parsed.data,
      image_url: parsed.data.image_url || null,
    });
    revalidatePath("/admin/eventos");
    revalidatePath("/eventos");
    return { ok: true, id: event.id };
  } catch (err) {
    return { ok: false, error: dbErrorMessage(err) };
  }
}

export async function updateEventAction(
  eventId: string,
  formData: FormData
): Promise<ActionResult> {
  await requireRole("ADMIN");
  const parsed = parseEventForm(formData);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  try {
    await updateEvent(supabase, eventId, {
      ...parsed.data,
      image_url: parsed.data.image_url || null,
    });
    revalidatePath("/admin/eventos");
    revalidatePath(`/admin/eventos/${eventId}`);
    revalidatePath("/eventos");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: dbErrorMessage(err) };
  }
}

export async function changeEventStatusAction(
  eventId: string,
  status: "OPEN" | "CLOSED" | "CANCELLED" | "FINISHED" | "DRAFT"
): Promise<ActionResult> {
  await requireRole("ADMIN");
  const supabase = await createClient();
  try {
    await updateEvent(supabase, eventId, { status });
    revalidatePath("/admin/eventos");
    revalidatePath(`/admin/eventos/${eventId}`);
    revalidatePath("/eventos");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: dbErrorMessage(err) };
  }
}

function dbErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes("duplicate key") && message.includes("slug")) {
    return "Já existe um evento com esse slug";
  }
  return "Não foi possível salvar o evento";
}
