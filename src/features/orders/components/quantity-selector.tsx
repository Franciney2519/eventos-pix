"use client";

import { Minus, Plus } from "lucide-react";

export function QuantitySelector({
  quantity,
  onChange,
  max,
}: {
  quantity: number;
  onChange: (value: number) => void;
  max: number;
}) {
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, quantity - 1))}
        disabled={quantity <= 1}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
        aria-label="Diminuir quantidade"
      >
        <Minus size={16} />
      </button>
      <span className="w-8 text-center text-lg font-semibold text-gray-900">{quantity}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, quantity + 1))}
        disabled={quantity >= max}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
        aria-label="Aumentar quantidade"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
