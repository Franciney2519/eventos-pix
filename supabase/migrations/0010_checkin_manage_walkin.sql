-- ============================================================================
-- Check-in staff now process walk-in sales themselves (venda avulsa), so
-- they need to be able to cancel a ticket or resend its email without
-- waiting on an admin — e.g. wrong email typed, buyer changed their mind.
-- ============================================================================

-- Same reasoning as 0003_orders_profiles_fk.sql: PostgREST embedding needs a
-- direct FK, not just a shared reference to auth.users, to show who (which
-- staff member) registered a walk-in sale alongside the order.
alter table orders
  add constraint orders_sold_by_profiles_fkey
  foreign key (sold_by) references profiles(user_id);
create or replace function cancel_ticket(p_ticket_id uuid, p_admin_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role user_role;
begin
  select role into v_role from profiles where user_id = p_admin_id;
  if v_role is null or v_role not in ('ADMIN', 'CHECKIN') then
    raise exception 'FORBIDDEN: only admin or check-in staff can cancel tickets';
  end if;

  update tickets
  set status = 'CANCELLED', cancelled_at = now()
  where id = p_ticket_id and status = 'AVAILABLE';

  if not found then
    raise exception 'TICKET_NOT_CANCELLABLE';
  end if;
end;
$$;
