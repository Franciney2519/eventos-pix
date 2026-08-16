import { describe, expect, it } from "vitest";
import { canConfirmEntry, evaluateTicketForCheckin } from "./rules";

describe("evaluateTicketForCheckin", () => {
  it("returns TICKET_NOT_FOUND for a nonexistent token", () => {
    expect(evaluateTicketForCheckin(null)).toBe("TICKET_NOT_FOUND");
  });

  it("returns OK for an available ticket", () => {
    expect(evaluateTicketForCheckin("AVAILABLE")).toBe("OK");
  });

  it("returns TICKET_ALREADY_USED for a used ticket (blocks second check-in)", () => {
    expect(evaluateTicketForCheckin("USED")).toBe("TICKET_ALREADY_USED");
  });

  it("returns TICKET_CANCELLED for a cancelled ticket", () => {
    expect(evaluateTicketForCheckin("CANCELLED")).toBe("TICKET_CANCELLED");
  });
});

describe("canConfirmEntry", () => {
  it("only allows confirming entry for AVAILABLE tickets", () => {
    expect(canConfirmEntry("AVAILABLE")).toBe(true);
    expect(canConfirmEntry("USED")).toBe(false);
    expect(canConfirmEntry("CANCELLED")).toBe(false);
  });
});
