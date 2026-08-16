-- ============================================================================
-- Lets a buyer name each ticket at purchase time (the name printed on that
-- ticket's crachá), instead of always printing the buyer's own name on every
-- badge in a multi-ticket order. Names are captured on the order at checkout
-- (one per unit, in ticket order) and copied onto each ticket row when
-- approve_order issues it. attendee_name is nullable so legacy tickets and
-- any gap in the array fall back to the buyer's profile name at read time.
-- ============================================================================
alter table orders add column if not exists attendee_names text[];
alter table tickets add column if not exists attendee_name text;

create or replace function approve_order(p_order_id uuid, p_admin_id uuid)
returns table(out_order_id uuid, out_tickets_created integer)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_order orders%rowtype;
  v_event events%rowtype;
  v_issued_count integer;
  v_approved_count integer;
  v_available integer;
  v_i integer;
  v_ticket_number text;
  v_token text;
  v_attendee_name text;
begin
  if (select role from profiles where user_id = p_admin_id) <> 'ADMIN' then
    raise exception 'FORBIDDEN: only admins can approve orders';
  end if;

  select * into v_order from orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  -- idempotency: already processed, no-op
  if v_order.payment_status = 'APPROVED' then
    select count(*) into v_issued_count from tickets t where t.order_id = v_order.id;
    return query select v_order.id, v_issued_count;
    return;
  end if;

  if v_order.payment_status <> 'PENDING' then
    raise exception 'ORDER_NOT_PENDING';
  end if;

  select * into v_event from events where id = v_order.event_id for update;

  select coalesce(sum(o.quantity), 0) into v_approved_count
  from orders o
  where o.event_id = v_event.id and o.payment_status = 'APPROVED' and o.id <> v_order.id;

  v_available := v_event.capacity - v_approved_count;
  if v_available < v_order.quantity then
    raise exception 'INSUFFICIENT_CAPACITY: only % seats left', v_available;
  end if;

  update orders set
    payment_status = 'APPROVED',
    order_status = 'CONFIRMED',
    approved_at = now(),
    approved_by = p_admin_id
  where id = v_order.id;

  update payment_proofs pp set
    review_status = 'APPROVED',
    reviewed_at = now(),
    reviewed_by = p_admin_id
  where pp.order_id = v_order.id and pp.review_status = 'PENDING';

  v_i := 1;
  while v_i <= v_order.quantity loop
    -- ticket_number e.g. EVT-000123-01 (order sequence + item index)
    v_ticket_number := 'EVT-' || substr(v_order.order_number, 5) || '-' || lpad(v_i::text, 2, '0');
    -- unique, unpredictable token (32 random bytes, hex) — never derived from ids/sequence
    v_token := encode(gen_random_bytes(32), 'hex');
    v_attendee_name := nullif(trim(v_order.attendee_names[v_i]), '');

    insert into tickets (order_id, event_id, ticket_number, token, status, attendee_name)
    values (v_order.id, v_event.id, v_ticket_number, v_token, 'AVAILABLE', v_attendee_name);

    v_i := v_i + 1;
  end loop;

  update orders set order_status = 'TICKETS_ISSUED' where id = v_order.id;

  select count(*) into v_issued_count from tickets t where t.order_id = v_order.id;
  return query select v_order.id, v_issued_count;
end;
$$;
