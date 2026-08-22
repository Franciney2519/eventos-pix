"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, Share2 } from "lucide-react";
import { formatEventDate } from "@/lib/format";

interface ExecutiveSummaryData {
  eventName: string;
  eventDate: string;
  capacity: number;
  sold: number;
  pending: number;
  available: number;
  onlineOrders: number;
  walkInOrders: number;
}

export function ExecutiveSummaryCard({ data }: { data: ExecutiveSummaryData }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"download" | "share" | null>(null);

  async function renderImage() {
    if (!cardRef.current) return null;
    return toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
  }

  async function handleDownload() {
    setBusy("download");
    try {
      const dataUrl = await renderImage();
      if (!dataUrl) return;
      const link = document.createElement("a");
      link.download = `resumo-${data.eventName.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setBusy(null);
    }
  }

  async function handleShare() {
    setBusy("share");
    try {
      const dataUrl = await renderImage();
      if (!dataUrl) return;
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `resumo-${data.eventName.toLowerCase().replace(/\s+/g, "-")}.png`, {
        type: "image/png",
      });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Resumo — ${data.eventName}`,
        });
      } else {
        // Fallback: no file-sharing support (desktop browsers). Just download it
        // so the person can attach it manually in WhatsApp Web.
        const link = document.createElement("a");
        link.download = file.name;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      if ((err as DOMException)?.name !== "AbortError") {
        console.error(err);
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div ref={cardRef} className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="bg-brand-600 px-6 py-5">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-100">Resumo executivo</p>
          <h3 className="mt-1 text-lg font-semibold text-white">{data.eventName}</h3>
          <p className="text-sm text-brand-100">{formatEventDate(data.eventDate)}</p>
        </div>
        <div className="grid grid-cols-2 gap-px bg-gray-100">
          <SummaryCell label="Total de ingressos" value={data.capacity} />
          <SummaryCell label="Vendidos" value={data.sold} />
          <SummaryCell label="Aguardando aprovação" value={data.pending} />
          <SummaryCell label="Disponíveis" value={data.available} />
          <SummaryCell label="Compras online" value={data.onlineOrders} />
          <SummaryCell label="Compras avulsas" value={data.walkInOrders} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={handleDownload} disabled={busy !== null} className="btn-secondary">
          <Download size={16} /> {busy === "download" ? "Gerando..." : "Baixar imagem"}
        </button>
        <button type="button" onClick={handleShare} disabled={busy !== null} className="btn-primary">
          <Share2 size={16} /> {busy === "share" ? "Gerando..." : "Enviar por WhatsApp"}
        </button>
      </div>
    </div>
  );
}

function SummaryCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white px-6 py-4">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}
