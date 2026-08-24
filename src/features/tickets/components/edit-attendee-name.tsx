"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Check, X } from "lucide-react";
import { updateTicketAttendeeNameAction } from "@/features/tickets/actions";
import { useToast } from "@/components/ui/toast";

export function EditAttendeeName({ ticketId, name }: { ticketId: string; name: string | undefined }) {
  const router = useRouter();
  const { show } = useToast();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name ?? "");
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setValue(name ?? "");
          setEditing(true);
        }}
        className="group flex items-center gap-1.5 text-left"
      >
        <span>{name || <span className="text-gray-400">—</span>}</span>
        <Pencil size={12} className="text-gray-300 opacity-0 group-hover:opacity-100" />
      </button>
    );
  }

  const save = () => {
    if (value.trim().length < 2) {
      show("Informe um nome válido", "error");
      return;
    }
    startTransition(async () => {
      const result = await updateTicketAttendeeNameAction(ticketId, value);
      if (!result.ok) {
        show(result.error ?? "Não foi possível atualizar o nome", "error");
        return;
      }
      show("Nome atualizado.", "success");
      setEditing(false);
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-1">
      <input
        autoFocus
        className="input !py-1 !text-sm"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") setEditing(false);
        }}
        disabled={pending}
      />
      <button className="btn-ghost !p-1.5 text-success-600" onClick={save} disabled={pending}>
        {pending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
      </button>
      <button className="btn-ghost !p-1.5 text-gray-400" onClick={() => setEditing(false)} disabled={pending}>
        <X size={14} />
      </button>
    </div>
  );
}
