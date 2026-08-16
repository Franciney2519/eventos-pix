/**
 * Pure business rules for orders/capacity — kept free of any DB or network
 * dependency so they can be unit tested directly. The Postgres RPC functions
 * (supabase/migrations/0001_init.sql) enforce the same rules transactionally
 * as the source of truth; these mirror them for UI-level pre-checks.
 */

export function computeOrderTotal(unitPrice: number, quantity: number): number {
  return Math.round(unitPrice * quantity * 100) / 100;
}

export function clampQuantity(quantity: number, maxPerOrder: number, available: number): number {
  const upperBound = Math.max(0, Math.min(maxPerOrder, available));
  if (quantity < 1) return Math.min(1, upperBound);
  return Math.min(quantity, upperBound);
}

export interface CapacityCheckResult {
  allowed: boolean;
  reason?: "INSUFFICIENT_CAPACITY" | "EXCEEDS_MAX_PER_ORDER" | "EVENT_NOT_OPEN";
  availableSeats: number;
}

export function checkOrderCapacity(params: {
  eventStatus: string;
  eventCapacity: number;
  approvedTicketsQuantity: number;
  requestedQuantity: number;
  maxTicketsPerOrder: number;
}): CapacityCheckResult {
  const availableSeats = params.eventCapacity - params.approvedTicketsQuantity;

  if (params.eventStatus !== "OPEN") {
    return { allowed: false, reason: "EVENT_NOT_OPEN", availableSeats };
  }
  if (params.requestedQuantity > params.maxTicketsPerOrder) {
    return { allowed: false, reason: "EXCEEDS_MAX_PER_ORDER", availableSeats };
  }
  if (params.requestedQuantity > availableSeats) {
    return { allowed: false, reason: "INSUFFICIENT_CAPACITY", availableSeats };
  }
  return { allowed: true, availableSeats };
}

/** Same capacity check performed transactionally inside approve_order(). */
export function canApproveOrder(params: {
  eventCapacity: number;
  otherApprovedQuantity: number;
  orderQuantity: number;
}): { allowed: boolean; availableSeats: number } {
  const availableSeats = params.eventCapacity - params.otherApprovedQuantity;
  return { allowed: params.orderQuantity <= availableSeats, availableSeats };
}
