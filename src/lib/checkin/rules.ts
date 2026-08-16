import type { TicketStatus } from "@/types/database";

export type CheckinOutcomeCode =
  | "OK"
  | "TICKET_NOT_FOUND"
  | "TICKET_ALREADY_USED"
  | "TICKET_CANCELLED";

/** Pure decision of what a scan should show, mirroring confirm_checkin() in SQL. */
export function evaluateTicketForCheckin(status: TicketStatus | null): CheckinOutcomeCode {
  if (status === null) return "TICKET_NOT_FOUND";
  if (status === "CANCELLED") return "TICKET_CANCELLED";
  if (status === "USED") return "TICKET_ALREADY_USED";
  return "OK";
}

export function canConfirmEntry(status: TicketStatus): boolean {
  return status === "AVAILABLE";
}
