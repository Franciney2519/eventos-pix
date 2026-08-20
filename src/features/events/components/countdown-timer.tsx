"use client";

import { useEffect, useState } from "react";

function getTimeLeft(targetIso: string) {
  const diff = new Date(targetIso).getTime() - Date.now();
  if (diff <= 0) return null;

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function CountdownTimer({ targetIso, accentColor = "#FD3A2D" }: { targetIso: string; accentColor?: string }) {
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft>>(() => getTimeLeft(targetIso));

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(getTimeLeft(targetIso)), 1000);
    return () => clearInterval(interval);
  }, [targetIso]);

  if (!timeLeft) return null;

  const units = [
    { label: "dias", value: timeLeft.days },
    { label: "horas", value: timeLeft.hours },
    { label: "min", value: timeLeft.minutes },
    { label: "seg", value: timeLeft.seconds },
  ];

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: accentColor, backgroundColor: `${accentColor}0d` }}>
      <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide" style={{ color: accentColor }}>
        Faltam para o evento
      </p>
      <div className="grid grid-cols-4 gap-2 text-center">
        {units.map((u) => (
          <div key={u.label}>
            <p className="text-2xl font-bold tabular-nums text-gray-900">{String(u.value).padStart(2, "0")}</p>
            <p className="text-[10px] uppercase text-gray-500">{u.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
