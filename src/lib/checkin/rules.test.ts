import { describe, expect, it } from "vitest";
import { canConfirmEntry, evaluateTicketForCheckin } from "./rules";

describe("evaluateTicketForCheckin", () => {
  it("returns TICKET_NOT_FOUND for a nonexistent token", () => {
    expect(evaluateTicketForCheckin(null, false)).toBe("TICKET_NOT_FOUND");
  });

  it("returns OK for an available ticket not yet checked in today", () => {
    expect(evaluateTicketForCheckin("AVAILABLE", false)).toBe("OK");
  });

  it("returns OK on day 2 for a ticket already checked in on a previous day", () => {
    // alreadyCheckedInToday reflects only *today's* window, so a ticket used
    // yesterday (multi-day event) is valid again today.
    expect(evaluateTicketForCheckin("AVAILABLE", false)).toBe("OK");
  });

  it("returns ALREADY_CHECKED_IN_TODAY when scanned twice the same day (blocks reuse)", () => {
    expect(evaluateTicketForCheckin("AVAILABLE", true)).toBe("ALREADY_CHECKED_IN_TODAY");
  });

  it("returns TICKET_CANCELLED for a cancelled ticket even if not checked in today", () => {
    expect(evaluateTicketForCheckin("CANCELLED", false)).toBe("TICKET_CANCELLED");
  });
});

describe("canConfirmEntry", () => {
  it("allows confirming entry when not cancelled and not yet checked in today", () => {
    expect(canConfirmEntry("AVAILABLE", false)).toBe(true);
  });

  it("blocks a second confirmation the same day", () => {
    expect(canConfirmEntry("AVAILABLE", true)).toBe(false);
  });

  it("blocks cancelled tickets regardless of today's check-in state", () => {
    expect(canConfirmEntry("CANCELLED", false)).toBe(false);
  });
});
