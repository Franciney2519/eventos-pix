"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { addProofObservationAction } from "@/features/orders/actions";
import { useToast } from "@/components/ui/toast";

export function ProofObservationForm({ proofId, initialObservation }: { proofId: string; initialObservation: string | null }) {
  const { show } = useToast();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(initialObservation ?? "");

  const save = () => {
    startTransition(async () => {
      const result = await addProofObservationAction(proofId, value);
      if (!result.ok) {
        show(result.error ?? "Não foi possível salvar", "error");
        return;
      }
      show("Observação salva.", "success");
    });
  };

  return (
    <div>
      <label className="label" htmlFor={`obs-${proofId}`}>
        Observação da análise
      </label>
      <textarea
        id={`obs-${proofId}`}
        className="input"
        rows={2}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Anotações internas sobre este comprovante"
      />
      <button className="btn-secondary mt-2 !px-3 !py-1.5 text-xs" disabled={pending} onClick={save}>
        {pending && <Loader2 size={12} className="animate-spin" />}
        Salvar observação
      </button>
    </div>
  );
}
