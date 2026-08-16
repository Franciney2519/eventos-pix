import type { TicketStatus } from "@/types/database";

export type CheckinOutcomeCode =
  | "OK"
  | "TICKET_NOT_FOUND"
  | "ALREADY_CHECKED_IN_TODAY"
  | "TICKET_CANCELLED";

/**
 * Pure decision of what a scan should show, mirroring confirm_checkin() in
 * SQL. Tickets stay valid for the whole (possibly multi-day) event —
 * entry is gated per calendar day via the checkins table, not by flipping
 * the ticket to a permanent "used" state. Only CANCELLED blocks entry
 * outright.
 */
export function evaluateTicketForCheckin(
  status: TicketStatus | null,
  alreadyCheckedInToday: boolean
): CheckinOutcomeCode {
  if (status === null) return "TICKET_NOT_FOUND";
  if (status === "CANCELLED") return "TICKET_CANCELLED";
  if (alreadyCheckedInToday) return "ALREADY_CHECKED_IN_TODAY";
  return "OK";
}

export function canConfirmEntry(status: TicketStatus, alreadyCheckedInToday: boolean): boolean {
  return status !== "CANCELLED" && !alreadyCheckedInToday;
}
