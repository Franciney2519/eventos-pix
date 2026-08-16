// América/Manaus is UTC-4 year-round (Brazil abolished DST in 2019), so a
// fixed offset is safe here — no DST table needed.
const MANAUS_OFFSET_HOURS = -4;

/** "Calendar day" (YYYY-MM-DD) of an ISO timestamp, in America/Manaus local time. */
export function toManausDateKey(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  const shifted = new Date(date.getTime() + MANAUS_OFFSET_HOURS * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

export function isSameManausDay(isoA: string, isoB: string): boolean {
  return toManausDateKey(isoA) === toManausDateKey(isoB);
}

/** Adds N days to a YYYY-MM-DD date key, returning a new date key (calendar arithmetic, no timezone involved). */
export function addDaysToDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** UTC instant range [start, end) covering "today" in America/Manaus, for range-filtering queries. */
export function getManausTodayUtcRange(nowIso: string = new Date().toISOString()): { startIso: string; endIso: string } {
  const dateKey = toManausDateKey(nowIso); // e.g. "2026-09-04"
  const startUtc = new Date(`${dateKey}T00:00:00.000-04:00`);
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);
  return { startIso: startUtc.toISOString(), endIso: endUtc.toISOString() };
}
