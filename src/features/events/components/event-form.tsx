"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { EventRow } from "@/types/database";
import { createEventAction, updateEventAction } from "@/features/events/actions";
import { useToast } from "@/components/ui/toast";

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Rascunho" },
  { value: "OPEN", label: "Inscrições abertas" },
  { value: "CLOSED", label: "Inscrições encerradas" },
  { value: "FINISHED", label: "Finalizado" },
  { value: "CANCELLED", label: "Cancelado" },
];

export function EventForm({ event }: { event?: EventRow }) {
  const router = useRouter();
  const { show } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = event
        ? await updateEventAction(event.id, formData)
        : await createEventAction(formData);

      if (!result.ok) {
        setError(result.error ?? "Não foi possível salvar o evento");
        return;
      }

      show(event ? "Evento atualizado!" : "Evento criado!", "success");
      router.push("/admin/eventos");
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome do evento" name="name" defaultValue={event?.name} required />
        <Field label="Slug (URL)" name="slug" defaultValue={event?.slug} placeholder="meu-evento" required />
      </div>

      <div>
        <label className="label">Descrição</label>
        <textarea name="description" defaultValue={event?.description ?? ""} rows={4} className="input" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Data" name="event_date" type="date" defaultValue={event?.event_date} required />
        <Field label="Horário" name="event_time" type="time" defaultValue={event?.event_time?.slice(0, 5)} required />
        <Field label="Status" name="status" as="select" defaultValue={event?.status ?? "DRAFT"}>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Local" name="location" defaultValue={event?.location} required />
        <Field label="Endereço" name="address" defaultValue={event?.address ?? ""} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Capacidade" name="capacity" type="number" min={1} defaultValue={event?.capacity} required />
        <Field label="Preço do ingresso (R$)" name="ticket_price" type="number" step="0.01" min={0} defaultValue={event?.ticket_price} required />
        <Field label="Máx. por compra" name="max_tickets_per_order" type="number" min={1} defaultValue={event?.max_tickets_per_order ?? 6} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Chave PIX" name="pix_key" defaultValue={event?.pix_key} required />
        <Field label="Nome do favorecido" name="pix_holder_name" defaultValue={event?.pix_holder_name} required />
      </div>

      <Field label="URL da imagem de capa (opcional)" name="image_url" defaultValue={event?.image_url ?? ""} placeholder="https://..." />

      {error && <p className="text-sm text-danger-600">{error}</p>}

      <button type="submit" className="btn-primary" disabled={pending}>
        {pending && <Loader2 size={16} className="animate-spin" />}
        {event ? "Salvar alterações" : "Criar evento"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  as = "input",
  children,
  ...rest
}: {
  label: string;
  name: string;
  type?: string;
  as?: "input" | "select";
  children?: React.ReactNode;
} & Record<string, unknown>) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      {as === "select" ? (
        <select id={name} name={name} className="input" {...rest}>
          {children}
        </select>
      ) : (
        <input id={name} name={name} type={type} className="input" {...rest} />
      )}
    </div>
  );
}
