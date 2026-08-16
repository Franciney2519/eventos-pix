-- ============================================================================
-- New email_type value for the "new order awaiting review" admin notification.
-- ALTER TYPE ... ADD VALUE cannot run inside the same transaction as a
-- statement that uses the new value, so this stays its own migration.
-- ============================================================================
alter type email_type add value if not exists 'NEW_ORDER_NOTIFICATION';
