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

/** UTC instant range [start, end) covering "today" in America/Manaus, for range-filtering queries. */
export function getManausTodayUtcRange(nowIso: string = new Date().toISOString()): { startIso: string; endIso: string } {
  const dateKey = toManausDateKey(nowIso); // e.g. "2026-09-04"
  const startUtc = new Date(`${dateKey}T00:00:00.000-04:00`);
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);
  return { startIso: startUtc.toISOString(), endIso: endUtc.toISOString() };
}
