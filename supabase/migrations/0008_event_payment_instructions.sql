-- ============================================================================
-- Adds a free-text field for extra payment instructions shown alongside the
-- PIX key on the checkout screen (e.g. bank account details, notes about
-- attaching the payment proof).
-- ============================================================================

alter table events add column payment_instructions text;
