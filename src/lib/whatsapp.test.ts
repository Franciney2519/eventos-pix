import { describe, expect, it } from "vitest";
import { buildWhatsAppLink } from "./whatsapp";

describe("buildWhatsAppLink", () => {
  it("strips formatting and prepends the country code", () => {
    expect(buildWhatsAppLink("(92) 98605-7067")).toBe("https://wa.me/5592986057067");
  });

  it("does not duplicate an already-present country code", () => {
    expect(buildWhatsAppLink("+55 92 98605-7067")).toBe("https://wa.me/5592986057067");
  });

  it("appends an URL-encoded prefilled message when provided", () => {
    expect(buildWhatsAppLink("92986057067", "Olá!")).toBe("https://wa.me/5592986057067?text=Ol%C3%A1!");
  });

  it("returns null for numbers too short to be real", () => {
    expect(buildWhatsAppLink("123")).toBeNull();
  });
});
