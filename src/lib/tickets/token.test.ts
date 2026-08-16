import { describe, expect, it } from "vitest";
import { formatTicketNumber, generateSecureToken } from "./token";

describe("generateSecureToken", () => {
  it("returns a 64-char hex string (32 bytes)", () => {
    const token = generateSecureToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("never repeats across calls", () => {
    const tokens = new Set(Array.from({ length: 1000 }, () => generateSecureToken()));
    expect(tokens.size).toBe(1000);
  });
});

describe("formatTicketNumber", () => {
  it("produces one distinct ticket number per index, sharing the order sequence", () => {
    const numbers = [1, 2, 3].map((i) => formatTicketNumber("ORD-000052", i));
    expect(numbers).toEqual(["EVT-000052-01", "EVT-000052-02", "EVT-000052-03"]);
    expect(new Set(numbers).size).toBe(3);
  });
});
