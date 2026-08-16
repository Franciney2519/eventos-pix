"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Copy, Loader2 } from "lucide-react";
import type { EventRow } from "@/types/database";
import { formatCurrencyBRL } from "@/lib/format";
import { computeOrderTotal } from "@/lib/orders/rules";
import { QuantitySelector } from "./quantity-selector";
import { ProofUpload } from "./proof-upload";
import { createOrderWithProofAction } from "@/features/orders/actions";
import { useToast } from "@/components/ui/toast";

export function OrderFlow({
  event,
  availableSeats,
  isLoggedIn,
}: {
  event: EventRow;
  availableSeats: number;
  isLoggedIn: boolean;
}) {
  const { show } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [quantity, setQuantity] = useState(1);
  const [attendeeNames, setAttendeeNames] = useState<string[]>([""]);
  const [namesError, setNamesError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const max = Math.max(0, Math.min(event.max_tickets_per_order, availableSeats));
  const total = computeOrderTotal(event.ticket_price, quantity);
  const canOrder = event.status === "OPEN" && max > 0;

  useEffect(() => {
    setAttendeeNames((prev) => {
      const next = prev.slice(0, quantity);
      while (next.length < quantity) next.push("");
      return next;
    });
  }, [quantity]);

  const updateAttendeeName = (index: number, value: string) => {
    setAttendeeNames((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const goToPayment = () => {
    if (attendeeNames.some((name) => name.trim().length < 2)) {
      setNamesError("Informe o nome completo de cada participante");
      return;
    }
    setNamesError(null);
    setStep(2);
  };

  const copyPixKey = async () => {
    try {
      await navigator.clipboard.writeText(event.pix_key);
      show("Chave PIX copiada!", "success");
    } catch {
      show("Não foi possível copiar a chave", "error");
    }
  };

  const submit = () => {
    setError(null);
    if (!file) {
      setFileError("Envie o comprovante de pagamento");
      return;
    }
    setFileError(null);

    const formData = new FormData();
    formData.set("eventId", event.id);
    formData.set("quantity", String(quantity));
    formData.set("attendeeNames", JSON.stringify(attendeeNames.map((name) => name.trim())));
    formData.set("proof", file);

    startTransition(async () => {
      const result = await createOrderWithProofAction(formData);
      // On success the action redirects (throws NEXT_REDIRECT), so reaching
      // here means it returned an error.
      if (result && !result.ok) {
        setError(result.error ?? "Não foi possível enviar sua solicitação");
      }
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="card text-center">
        <p className="text-sm text-gray-600">Faça login para comprar ingressos deste evento.</p>
        <Link href={`/login?redirect=/eventos/${event.slug}`} className="btn-primary mt-4 inline-flex">
          Entrar para continuar
        </Link>
      </div>
    );
  }

  if (!canOrder) {
    return (
      <div className="card text-center">
        <p className="text-sm text-gray-600">
          {event.status !== "OPEN" ? "As inscrições não estão abertas no momento." : "Ingressos esgotados."}
        </p>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="card space-y-5">
        <div>
          <p className="label mb-2">Quantidade</p>
          <QuantitySelector quantity={quantity} onChange={setQuantity} max={max} />
          <p className="mt-1 text-xs text-gray-400">Máximo {max} ingresso(s) nesta compra</p>
        </div>

        <div className="space-y-2 border-t border-gray-100 pt-4">
          <p className="label mb-0">
            Nome no crachá {quantity > 1 ? "de cada participante" : ""}
          </p>
          {attendeeNames.map((name, i) => (
            <input
              key={i}
              type="text"
              value={name}
              onChange={(e) => updateAttendeeName(i, e.target.value)}
              placeholder={quantity > 1 ? `Nome completo do ingresso ${i + 1}` : "Nome completo"}
              className="input"
            />
          ))}
          {namesError && <p className="text-sm text-danger-600">{namesError}</p>}
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <div>
            <p className="text-xs text-gray-400">Valor unitário</p>
            <p className="text-sm font-medium text-gray-900">{formatCurrencyBRL(event.ticket_price)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrencyBRL(total)}</p>
          </div>
        </div>

        <button className="btn-primary w-full" onClick={goToPayment}>
          Continuar
        </button>
      </div>
    );
  }

  return (
    <div className="card space-y-5">
      <div>
        <h3 className="font-semibold text-gray-900">Pagamento via PIX</h3>
        <p className="text-sm text-gray-500">
          {quantity} ingresso(s) · Total {formatCurrencyBRL(total)}
        </p>
      </div>

      <div className="rounded-xl bg-gray-50 p-4">
        <p className="text-xs text-gray-400">Chave PIX</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="break-all font-medium text-gray-900">{event.pix_key}</p>
          <button type="button" onClick={copyPixKey} className="btn-secondary shrink-0 !px-3 !py-2">
            <Copy size={14} /> Copiar
          </button>
        </div>
        <p className="mt-3 text-xs text-gray-400">Favorecido</p>
        <p className="font-medium text-gray-900">{event.pix_holder_name}</p>
        {event.payment_instructions && (
          <p className="mt-3 whitespace-pre-line text-sm text-gray-600">{event.payment_instructions}</p>
        )}
      </div>

      <div>
        <p className="label mb-2">Envie seu comprovante</p>
        <ProofUpload file={file} onChange={setFile} error={fileError} />
      </div>

      {error && <p className="text-sm text-danger-600">{error}</p>}

      <div className="flex gap-3">
        <button className="btn-secondary flex-1" onClick={() => setStep(1)} disabled={pending}>
          Voltar
        </button>
        <button className="btn-primary flex-1" onClick={submit} disabled={pending}>
          {pending && <Loader2 size={16} className="animate-spin" />}
          Enviar solicitação
        </button>
      </div>
    </div>
  );
}
