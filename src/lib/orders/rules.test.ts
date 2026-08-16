import { describe, expect, it } from "vitest";
import { canApproveOrder, checkOrderCapacity, clampQuantity, computeOrderTotal } from "./rules";

describe("computeOrderTotal", () => {
  it("multiplies unit price by quantity", () => {
    expect(computeOrderTotal(50, 3)).toBe(150);
  });

  it("rounds to two decimal places", () => {
    expect(computeOrderTotal(33.335, 3)).toBe(100.01);
  });
});

describe("clampQuantity", () => {
  it("clamps to available seats when lower than max per order", () => {
    expect(clampQuantity(10, 6, 2)).toBe(2);
  });

  it("clamps to max per order when seats are plentiful", () => {
    expect(clampQuantity(10, 6, 100)).toBe(6);
  });

  it("never returns less than 1 when seats exist", () => {
    expect(clampQuantity(0, 6, 5)).toBe(1);
  });

  it("returns 0 when there are no seats available", () => {
    expect(clampQuantity(3, 6, 0)).toBe(0);
  });
});

describe("checkOrderCapacity", () => {
  const base = {
    eventStatus: "OPEN",
    eventCapacity: 100,
    approvedTicketsQuantity: 90,
    maxTicketsPerOrder: 6,
  };

  it("allows a request within remaining capacity and max per order", () => {
    const result = checkOrderCapacity({ ...base, requestedQuantity: 5 });
    expect(result.allowed).toBe(true);
    expect(result.availableSeats).toBe(10);
  });

  it("rejects when the event is not OPEN", () => {
    const result = checkOrderCapacity({ ...base, eventStatus: "CLOSED", requestedQuantity: 2 });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("EVENT_NOT_OPEN");
  });

  it("rejects when quantity exceeds the per-order maximum", () => {
    const result = checkOrderCapacity({ ...base, requestedQuantity: 7 });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("EXCEEDS_MAX_PER_ORDER");
  });

  it("rejects when quantity exceeds remaining capacity but is within the per-order max", () => {
    const result = checkOrderCapacity({ ...base, approvedTicketsQuantity: 96, requestedQuantity: 5 });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("INSUFFICIENT_CAPACITY");
    expect(result.availableSeats).toBe(4);
  });
});

describe("canApproveOrder — mirrors approve_order() capacity guard", () => {
  it("allows approval that exactly fills remaining capacity", () => {
    const result = canApproveOrder({ eventCapacity: 100, otherApprovedQuantity: 97, orderQuantity: 3 });
    expect(result.allowed).toBe(true);
    expect(result.availableSeats).toBe(3);
  });

  it("blocks approval that would overbook the event", () => {
    const result = canApproveOrder({ eventCapacity: 100, otherApprovedQuantity: 98, orderQuantity: 3 });
    expect(result.allowed).toBe(false);
    expect(result.availableSeats).toBe(2);
  });
});
