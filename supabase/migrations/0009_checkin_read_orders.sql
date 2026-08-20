-- ============================================================================
-- Bug fix: the /checkin dashboard shows "Vendidos" / "Vagas livres" by
-- querying orders directly with the operator's own session, but the RLS
-- policy only allowed ADMIN (not CHECKIN) to read orders — so a CHECKIN-role
-- operator always saw 0 sold / full capacity, regardless of real sales.
-- CHECKIN staff already have read access to tickets/checkins; extending the
-- same read-only access to orders is consistent (no write access granted).
-- ============================================================================
drop policy if exists "orders_select_own_or_staff" on orders;

create policy "orders_select_own_or_staff" on orders for select
  using (user_id = auth.uid() or current_user_role() in ('ADMIN', 'CHECKIN'));
