-- ============================================================================
-- Tracks whether a ticket's badge/crachá has been printed, so the admin can
-- see pending vs. printed at a glance in /admin/ingressos. Nullable and
-- freely overwritable — reprinting is always allowed and just updates the
-- timestamp to the most recent print.
-- ============================================================================
alter table tickets add column if not exists badge_printed_at timestamptz;
