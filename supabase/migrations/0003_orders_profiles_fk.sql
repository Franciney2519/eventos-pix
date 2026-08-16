-- ============================================================================
-- orders.user_id already references auth.users(id). PostgREST embedding
-- (e.g. `profiles!orders_user_id_profiles_fkey(full_name, email)` used
-- throughout the admin UI to show buyer info alongside an order) requires a
-- *direct* foreign key between the two embedded tables — a shared reference
-- to auth.users is not enough. profiles.user_id is unique and points at the
-- same auth.users row, so it's safe to add a second FK on the same column.
-- ============================================================================
alter table orders
  add constraint orders_user_id_profiles_fkey
  foreign key (user_id) references profiles(user_id);
