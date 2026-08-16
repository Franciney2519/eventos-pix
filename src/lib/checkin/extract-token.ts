export function extractTokenFromScan(raw: string): string {
  const trimmed = raw.trim();
  const marker = "/ticket/";
  const idx = trimmed.indexOf(marker);
  if (idx === -1) return trimmed;
  return trimmed.slice(idx + marker.length).split(/[?#]/)[0]!;
}
