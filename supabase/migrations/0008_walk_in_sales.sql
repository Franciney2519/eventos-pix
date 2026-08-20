-- ============================================================================
-- Walk-in ("venda avulsa") sales: check-in staff can sell a ticket on the
-- spot on event day, without going through the payment-proof review flow.
-- ============================================================================
alter table orders add column if not exists sale_channel text not null default 'ONLINE'
  check (sale_channel in ('ONLINE', 'WALK_IN'));
alter table orders add column if not exists payment_method text
  check (payment_method is null or payment_method in ('PIX', 'CASH'));
alter table orders add column if not exists sold_by uuid references auth.users(id);

comment on column orders.sale_channel is 'ONLINE = normal PIX+proof flow; WALK_IN = sold on-site by check-in/admin staff';
comment on column orders.payment_method is 'Only set for WALK_IN orders: how the operator collected payment';
comment on column orders.sold_by is 'Staff member (ADMIN or CHECKIN) who registered a WALK_IN sale';

-- create_walk_in_sale ---------------------------------------------------------
-- Atomically checks capacity, creates a pre-approved order + single ticket,
-- for a buyer who may or may not already have an account. Mirrors
-- approve_order()'s capacity guard and ticket-issuance logic, but skips
-- straight to APPROVED/TICKETS_ISSUED since there is no proof to review —
-- the operator is standing there taking cash/PIX in person.
create or replace function create_walk_in_sale(
  p_event_id uuid,
  p_buyer_user_id uuid,
  p_operator_id uuid,
  p_payment_method text,
  p_attendee_name text default null
)
returns table(out_order_id uuid, out_ticket_id uuid, out_ticket_number text, out_token text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_role user_role;
  v_event events%rowtype;
  v_approved_count integer;
  v_available integer;
  v_order_number text;
  v_order_id uuid;
  v_ticket_number text;
  v_token text;
begin
  select role into v_role from profiles where user_id = p_operator_id;
  if v_role is null or v_role not in ('ADMIN', 'CHECKIN') then
    raise exception 'FORBIDDEN: only admin or check-in staff can register walk-in sales';
  end if;

  if p_payment_method not in ('PIX', 'CASH') then
    raise exception 'INVALID_PAYMENT_METHOD';
  end if;

  select * into v_event from events where id = p_event_id for update;
  if not found then
    raise exception 'EVENT_NOT_FOUND';
  end if;

  select coalesce(sum(o.quantity), 0) into v_approved_count
  from orders o
  where o.event_id = v_event.id and o.payment_status = 'APPROVED';

  v_available := v_event.capacity - v_approved_count;
  if v_available < 1 then
    raise exception 'INSUFFICIENT_CAPACITY: no seats left';
  end if;

  v_order_number := generate_order_number();

  insert into orders (
    order_number, user_id, event_id, quantity, unit_price, total_amount,
    payment_status, order_status, approved_at, approved_by,
    sale_channel, payment_method, sold_by
  ) values (
    v_order_number, p_buyer_user_id, v_event.id, 1, v_event.ticket_price, v_event.ticket_price,
    'APPROVED', 'TICKETS_ISSUED', now(), p_operator_id,
    'WALK_IN', p_payment_method, p_operator_id
  )
  returning id into v_order_id;

  v_ticket_number := 'EVT-' || substr(v_order_number, 5) || '-01';
  v_token := encode(gen_random_bytes(32), 'hex');

  insert into tickets (order_id, event_id, ticket_number, token, status, attendee_name)
  values (v_order_id, v_event.id, v_ticket_number, v_token, 'AVAILABLE', p_attendee_name);

  return query
    select v_order_id, t.id, t.ticket_number, t.token
    from tickets t
    where t.order_id = v_order_id;
end;
$$;
