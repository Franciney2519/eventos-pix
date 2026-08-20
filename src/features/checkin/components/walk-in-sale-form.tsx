"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { Banknote, CreditCard, Loader2, MessageCircle, CheckCircle2 } from "lucide-react";
import { createWalkInSaleAction, type WalkInSaleResult } from "@/features/checkin/actions";
import { useToast } from "@/components/ui/toast";

export function WalkInSaleForm({ eventId, ticketPrice }: { eventId: string; ticketPrice: number }) {
  const router = useRouter();
  const { show } = useToast();
  const [pending, startTransition] = useTransition();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CASH">("CASH");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WalkInSaleResult | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("eventId", eventId);
    formData.set("fullName", fullName);
    formData.set("email", email);
    formData.set("phone", phone);
    formData.set("paymentMethod", paymentMethod);

    startTransition(async () => {
      const res = await createWalkInSaleAction(formData);
      if (!res.ok) {
        setError(res.error ?? "Não foi possível registrar a venda");
        return;
      }
      setResult(res);
      show(`Ingresso ${res.ticketNumber} emitido!`, "success");
      router.refresh();
    });
  };

  const startOver = () => {
    setResult(null);
    setFullName("");
    setEmail("");
    setPhone("");
    setPaymentMethod("CASH");
  };

  if (result) {
    return (
      <div className="card flex flex-col items-center gap-4 py-8 text-center">
        <CheckCircle2 size={40} className="text-success-600" />
        <div>
          <p className="font-semibold text-gray-900">Ingresso emitido!</p>
          <p className="font-mono text-sm text-gray-500">{result.ticketNumber}</p>
        </div>

        <div className="bg-white p-3">
          <QRCode value={result.ticketUrl!} size={180} />
        </div>

        <p className="text-xs text-gray-500">O ingresso também foi enviado por e-mail.</p>

        <div className="flex w-full max-w-xs flex-col gap-2">
          {result.whatsappLink && (
            <a href={result.whatsappLink} target="_blank" rel="noopener noreferrer" className="btn-primary w-full">
              <MessageCircle size={16} /> Enviar pelo WhatsApp
            </a>
          )}
          <button className="btn-secondary w-full" onClick={startOver}>
            Registrar outra venda
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <div>
        <label className="label" htmlFor="fullName">
          Nome completo
        </label>
        <input id="fullName" className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </div>
      <div>
        <label className="label" htmlFor="email">
          E-mail
        </label>
        <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <label className="label" htmlFor="phone">
          WhatsApp
        </label>
        <input id="phone" className="input" placeholder="(00) 00000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      </div>

      <div>
        <p className="label mb-2">Forma de pagamento</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPaymentMethod("CASH")}
            className={`flex items-center justify-center gap-2 border-2 p-3 text-sm font-semibold ${
              paymentMethod === "CASH" ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600"
            }`}
          >
            <Banknote size={16} /> Dinheiro
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("PIX")}
            className={`flex items-center justify-center gap-2 border-2 p-3 text-sm font-semibold ${
              paymentMethod === "PIX" ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600"
            }`}
          >
            <CreditCard size={16} /> PIX
          </button>
        </div>
      </div>

      <div className="border-t-2 border-gray-100 pt-3 text-sm text-gray-500">
        Valor a cobrar: <span className="font-semibold text-gray-900">{ticketPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
      </div>

      {error && <p className="text-sm text-danger-600">{error}</p>}

      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending && <Loader2 size={16} className="animate-spin" />}
        Confirmar venda
      </button>
    </form>
  );
}
