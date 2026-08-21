const TIMEZONE = "America/Manaus";

export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

/** event_date is a plain DATE column (no time/timezone) — format as-is, no conversion needed. */
export function formatEventDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

export function formatEventTime(time: string): string {
  return time.slice(0, 5);
}

/**
 * Formats a real timestamp (created_at, checked_in_at, etc.) in
 * America/Manaus local time — explicit, so it's correct regardless of
 * which timezone the server process itself runs in (Vercel defaults to
 * UTC, which is 4h ahead of Manaus).
 */
export function formatDateTime(isoDateTime: string): string {
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoDateTime));
  return formatted.replace(",", " às");
}

export function formatTimeOnly(isoDateTime: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoDateTime));
}
