-- ============================================================================
-- App Ingresso — initial schema
-- Tables, enums, RLS policies and atomic RPC functions for the critical
-- business operations (order approval, ticket issuance, check-in).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
create type user_role as enum ('CUSTOMER', 'ADMIN', 'CHECKIN');
create type event_status as enum ('DRAFT', 'OPEN', 'CLOSED', 'FINISHED', 'CANCELLED');
create type payment_status as enum ('PENDING', 'APPROVED', 'REJECTED');
create type order_status as enum ('WAITING_PAYMENT_REVIEW', 'CONFIRMED', 'TICKETS_ISSUED', 'CANCELLED');
create type proof_review_status as enum ('PENDING', 'APPROVED', 'REJECTED');
create type ticket_status as enum ('AVAILABLE', 'USED', 'CANCELLED');
create type checkin_source as enum ('QR', 'MANUAL');
create type email_type as enum ('TICKETS_ISSUED', 'ORDER_REJECTED');
create type email_status as enum ('SENT', 'FAILED');

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  role user_role not null default 'CUSTOMER',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_user_id on profiles(user_id);
create index idx_profiles_role on profiles(role);

-- ----------------------------------------------------------------------------
-- events
-- ----------------------------------------------------------------------------
create table events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  event_date date not null,
  event_time time not null,
  location text not null,
  address text,
  capacity integer not null check (capacity > 0),
  ticket_price numeric(10,2) not null check (ticket_price >= 0),
  max_tickets_per_order integer not null default 6 check (max_tickets_per_order > 0),
  pix_key text not null,
  pix_holder_name text not null,
  image_url text,
  status event_status not null default 'DRAFT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_events_slug on events(slug);
create index idx_events_status on events(status);

-- ----------------------------------------------------------------------------
-- orders
-- ----------------------------------------------------------------------------
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references events(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  total_amount numeric(10,2) not null check (total_amount >= 0),
  payment_status payment_status not null default 'PENDING',
  order_status order_status not null default 'WAITING_PAYMENT_REVIEW',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users(id),
  rejected_at timestamptz,
  rejected_by uuid references auth.users(id),
  rejection_reason text
);

create index idx_orders_user_id on orders(user_id);
create index idx_orders_event_id on orders(event_id);
create index idx_orders_payment_status on orders(payment_status);
create index idx_orders_order_status on orders(order_status);

-- ----------------------------------------------------------------------------
-- payment_proofs
-- ----------------------------------------------------------------------------
create table payment_proofs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  mime_type text not null,
  file_size integer not null,
  uploaded_at timestamptz not null default now(),
  review_status proof_review_status not null default 'PENDING',
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  observation text
);

create index idx_payment_proofs_order_id on payment_proofs(order_id);

-- ----------------------------------------------------------------------------
-- tickets
-- ----------------------------------------------------------------------------
create table tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  event_id uuid not null references events(id) on delete restrict,
  ticket_number text not null unique,
  token text not null unique,
  status ticket_status not null default 'AVAILABLE',
  issued_at timestamptz not null default now(),
  used_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_tickets_order_id on tickets(order_id);
create index idx_tickets_event_id on tickets(event_id);
create index idx_tickets_token on tickets(token);
create index idx_tickets_status on tickets(status);

-- ----------------------------------------------------------------------------
-- checkins
-- ----------------------------------------------------------------------------
create table checkins (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  event_id uuid not null references events(id) on delete restrict,
  checked_in_at timestamptz not null default now(),
  checked_in_by uuid references auth.users(id),
  source checkin_source not null default 'QR',
  device_info text,
  ip_address text
);

create index idx_checkins_event_id on checkins(event_id);
create index idx_checkins_ticket_id on checkins(ticket_id);

-- ----------------------------------------------------------------------------
-- email_logs
-- ----------------------------------------------------------------------------
create table email_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  type email_type not null,
  recipient text not null,
  status email_status not null,
  provider_message_id text,
  sent_at timestamptz not null default now(),
  error_message text
);

create index idx_email_logs_order_id on email_logs(order_id);

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();
create trigger trg_events_updated_at before update on events
  for each row execute function set_updated_at();
create trigger trg_orders_updated_at before update on orders
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Auto-create profile on signup
-- ----------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    new.raw_user_meta_data->>'phone',
    'CUSTOMER'
  );
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ----------------------------------------------------------------------------
-- Helper: current user's role (used inside RLS policies)
-- ----------------------------------------------------------------------------
create or replace function current_user_role()
returns user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from profiles where user_id = auth.uid();
$$;

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table profiles enable row level security;
alter table events enable row level security;
alter table orders enable row level security;
alter table payment_proofs enable row level security;
alter table tickets enable row level security;
alter table checkins enable row level security;
alter table email_logs enable row level security;

-- profiles ---------------------------------------------------------------
create policy "profiles_select_own_or_staff" on profiles for select
  using (user_id = auth.uid() or current_user_role() in ('ADMIN', 'CHECKIN'));

create policy "profiles_update_own" on profiles for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "profiles_admin_all" on profiles for all
  using (current_user_role() = 'ADMIN')
  with check (current_user_role() = 'ADMIN');

-- events -------------------------------------------------------------------
create policy "events_select_public_open" on events for select
  using (status in ('OPEN', 'CLOSED', 'FINISHED') or current_user_role() in ('ADMIN', 'CHECKIN'));

create policy "events_admin_write" on events for insert
  with check (current_user_role() = 'ADMIN');
create policy "events_admin_update" on events for update
  using (current_user_role() = 'ADMIN')
  with check (current_user_role() = 'ADMIN');
create policy "events_admin_delete" on events for delete
  using (current_user_role() = 'ADMIN');

-- orders ---------------------------------------------------------------------
create policy "orders_select_own_or_staff" on orders for select
  using (user_id = auth.uid() or current_user_role() = 'ADMIN');

create policy "orders_insert_own" on orders for insert
  with check (user_id = auth.uid());

create policy "orders_admin_update" on orders for update
  using (current_user_role() = 'ADMIN')
  with check (current_user_role() = 'ADMIN');

-- payment_proofs ---------------------------------------------------------------
create policy "payment_proofs_select_own_or_staff" on payment_proofs for select
  using (
    current_user_role() = 'ADMIN'
    or exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid())
  );

create policy "payment_proofs_insert_own" on payment_proofs for insert
  with check (
    exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid())
  );

create policy "payment_proofs_admin_update" on payment_proofs for update
  using (current_user_role() = 'ADMIN')
  with check (current_user_role() = 'ADMIN');

-- tickets ---------------------------------------------------------------------
create policy "tickets_select_own_or_staff" on tickets for select
  using (
    current_user_role() in ('ADMIN', 'CHECKIN')
    or exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid())
  );

create policy "tickets_admin_write" on tickets for all
  using (current_user_role() = 'ADMIN')
  with check (current_user_role() = 'ADMIN');

-- checkins ---------------------------------------------------------------------
create policy "checkins_select_staff" on checkins for select
  using (current_user_role() in ('ADMIN', 'CHECKIN'));

create policy "checkins_insert_staff" on checkins for insert
  with check (current_user_role() in ('ADMIN', 'CHECKIN'));

-- email_logs ---------------------------------------------------------------------
create policy "email_logs_select_own_or_admin" on email_logs for select
  using (user_id = auth.uid() or current_user_role() = 'ADMIN');

-- ============================================================================
-- Atomic RPC functions (SECURITY DEFINER — internally re-check role)
-- ============================================================================

-- Generates the next order number in the form ORD-000123 -------------------
create sequence if not exists order_number_seq start 1;

create or replace function generate_order_number()
returns text
language sql
as $$
  select 'ORD-' || lpad(nextval('order_number_seq')::text, 6, '0');
$$;

-- approve_order --------------------------------------------------------------
-- Idempotent, transactional order approval:
--   1. locks the order row
--   2. verifies it is still pending review
--   3. verifies event capacity is sufficient
--   4. marks payment/order as approved
--   5. issues one ticket per unit with a unique secure token
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

    insert into tickets (order_id, event_id, ticket_number, token, status)
    values (v_order.id, v_event.id, v_ticket_number, v_token, 'AVAILABLE');

    v_i := v_i + 1;
  end loop;

  update orders set order_status = 'TICKETS_ISSUED' where id = v_order.id;

  select count(*) into v_issued_count from tickets t where t.order_id = v_order.id;
  return query select v_order.id, v_issued_count;
end;
$$;

-- reject_order --------------------------------------------------------------
create or replace function reject_order(p_order_id uuid, p_admin_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
begin
  if (select role from profiles where user_id = p_admin_id) <> 'ADMIN' then
    raise exception 'FORBIDDEN: only admins can reject orders';
  end if;

  select * into v_order from orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if v_order.payment_status <> 'PENDING' then
    raise exception 'ORDER_NOT_PENDING';
  end if;

  update orders set
    payment_status = 'REJECTED',
    order_status = 'CANCELLED',
    rejected_at = now(),
    rejected_by = p_admin_id,
    rejection_reason = p_reason
  where id = v_order.id;

  update payment_proofs set
    review_status = 'REJECTED',
    reviewed_at = now(),
    reviewed_by = p_admin_id,
    observation = p_reason
  where order_id = v_order.id and review_status = 'PENDING';
end;
$$;

-- confirm_checkin --------------------------------------------------------------
-- Atomically flips a ticket AVAILABLE -> USED and records the checkin.
-- Uses a single UPDATE ... WHERE status = 'AVAILABLE' so concurrent scans of
-- the same QR code can never both succeed.
create or replace function confirm_checkin(
  p_ticket_id uuid,
  p_operator_id uuid,
  p_source checkin_source,
  p_device_info text default null,
  p_ip_address text default null
)
returns table(success boolean, message text, ticket_number text, checked_in_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role user_role;
  v_ticket tickets%rowtype;
  v_updated tickets%rowtype;
begin
  select role into v_role from profiles where user_id = p_operator_id;
  if v_role is null or v_role not in ('ADMIN', 'CHECKIN') then
    raise exception 'FORBIDDEN: only checkin staff can confirm entry';
  end if;

  select * into v_ticket from tickets where id = p_ticket_id;
  if not found then
    return query select false, 'TICKET_NOT_FOUND', null::text, null::timestamptz;
    return;
  end if;

  if v_ticket.status = 'CANCELLED' then
    return query select false, 'TICKET_CANCELLED', v_ticket.ticket_number, null::timestamptz;
    return;
  end if;

  if v_ticket.status = 'USED' then
    return query select false, 'TICKET_ALREADY_USED', v_ticket.ticket_number, v_ticket.used_at;
    return;
  end if;

  update tickets
  set status = 'USED', used_at = now()
  where id = p_ticket_id and status = 'AVAILABLE'
  returning * into v_updated;

  if not found then
    -- lost the race to a concurrent check-in
    select * into v_ticket from tickets where id = p_ticket_id;
    return query select false, 'TICKET_ALREADY_USED', v_ticket.ticket_number, v_ticket.used_at;
    return;
  end if;

  insert into checkins (ticket_id, event_id, checked_in_by, source, device_info, ip_address)
  values (v_updated.id, v_updated.event_id, p_operator_id, p_source, p_device_info, p_ip_address);

  return query select true, 'OK', v_updated.ticket_number, v_updated.used_at;
end;
$$;

-- cancel_ticket --------------------------------------------------------------
create or replace function cancel_ticket(p_ticket_id uuid, p_admin_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select role from profiles where user_id = p_admin_id) <> 'ADMIN' then
    raise exception 'FORBIDDEN: only admins can cancel tickets';
  end if;

  update tickets
  set status = 'CANCELLED', cancelled_at = now()
  where id = p_ticket_id and status = 'AVAILABLE';

  if not found then
    raise exception 'TICKET_NOT_CANCELLABLE';
  end if;
end;
$$;
