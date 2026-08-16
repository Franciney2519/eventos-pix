import { describe, expect, it } from "vitest";
import { addDaysToDateKey, getManausTodayUtcRange, isSameManausDay, toManausDateKey } from "./timezone";

describe("toManausDateKey", () => {
  it("keeps a mid-day UTC timestamp on the same calendar day (UTC-4)", () => {
    expect(toManausDateKey("2026-09-04T18:00:00.000Z")).toBe("2026-09-04");
  });

  it("rolls a late-UTC timestamp back to the previous day in Manaus", () => {
    // 2026-09-05T02:00:00Z is 2026-09-04T22:00 in America/Manaus (UTC-4)
    expect(toManausDateKey("2026-09-05T02:00:00.000Z")).toBe("2026-09-04");
  });

  it("rolls an early-UTC timestamp forward correctly once past the Manaus midnight boundary", () => {
    // 2026-09-05T04:30:00Z is 2026-09-05T00:30 in America/Manaus
    expect(toManausDateKey("2026-09-05T04:30:00.000Z")).toBe("2026-09-05");
  });
});

describe("isSameManausDay", () => {
  it("treats two check-ins on different calendar days as different days (allows re-entry)", () => {
    expect(isSameManausDay("2026-09-04T20:00:00.000Z", "2026-09-05T20:00:00.000Z")).toBe(false);
  });

  it("treats two check-ins on the same calendar day as the same day (blocks reuse)", () => {
    expect(isSameManausDay("2026-09-04T13:00:00.000Z", "2026-09-04T23:00:00.000Z")).toBe(true);
  });
});

describe("addDaysToDateKey", () => {
  it("advances to the next day", () => {
    expect(addDaysToDateKey("2026-09-04", 1)).toBe("2026-09-05");
  });

  it("rolls over month boundaries", () => {
    expect(addDaysToDateKey("2026-09-30", 1)).toBe("2026-10-01");
  });
});

describe("getManausTodayUtcRange", () => {
  it("returns a 24h UTC window that fully contains a same-day Manaus timestamp", () => {
    const { startIso, endIso } = getManausTodayUtcRange("2026-09-04T18:00:00.000Z");
    expect(new Date(startIso).getTime()).toBeLessThanOrEqual(new Date("2026-09-04T18:00:00.000Z").getTime());
    expect(new Date(endIso).getTime()).toBeGreaterThan(new Date("2026-09-04T18:00:00.000Z").getTime());
    expect(new Date(endIso).getTime() - new Date(startIso).getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it("excludes a timestamp from the following Manaus day", () => {
    const { endIso } = getManausTodayUtcRange("2026-09-04T18:00:00.000Z");
    // 2026-09-05T12:00:00Z is 2026-09-05 in Manaus — the next day, must fall outside the window
    expect(new Date("2026-09-05T12:00:00.000Z").getTime()).toBeGreaterThanOrEqual(new Date(endIso).getTime());
  });
});
