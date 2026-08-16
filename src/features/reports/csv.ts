export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]!);
  const lines = [headers.join(",")];

  for (const row of rows) {
    const cells = headers.map((h) => escapeCsvCell(row[h]));
    lines.push(cells.join(","));
  }

  return lines.join("\n");
}

function escapeCsvCell(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
