import { randomBytes } from "crypto";

/**
 * Cryptographically secure, unpredictable ticket token (32 bytes = 256 bits
 * of entropy, hex-encoded). This — never the ticket_number or id — is what
 * goes into the QR code and the /ticket/[token] URL.
 */
export function generateSecureToken(): string {
  return randomBytes(32).toString("hex");
}

/** EVT-<order seq>-<01..NN>, e.g. order ORD-000123 quantity 3 -> EVT-000123-01/02/03 */
export function formatTicketNumber(orderNumber: string, index: number): string {
  const seq = orderNumber.replace(/^ORD-/, "");
  return `EVT-${seq}-${String(index).padStart(2, "0")}`;
}

export function ticketPublicUrl(appUrl: string, token: string): string {
  return `${appUrl.replace(/\/$/, "")}/ticket/${token}`;
}
