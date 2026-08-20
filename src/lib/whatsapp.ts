/**
 * Builds a wa.me deep link from a Brazilian phone number as typed by users
 * (varies: "92 986057067", "(92) 98605-7067", "+55 92 98605-7067"...).
 * Strips everything but digits and prepends the 55 country code unless
 * it's already present.
 */
export function buildWhatsAppLink(phone: string, message?: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null; // too short to be a real DDD+number

  const withCountryCode = digits.startsWith("55") ? digits : `55${digits}`;
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${withCountryCode}${query}`;
}
