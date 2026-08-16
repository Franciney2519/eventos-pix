-- ============================================================================
-- Multi-day check-in: an event can span more than one day (e.g. Sexta +
-- Sábado), so a ticket must allow one entry per calendar day rather than a
-- single lifetime use. Re-scanning the SAME QR on the SAME day is still
-- blocked (the original anti-fraud guarantee); scanning it again on a
-- different day is allowed and recorded as a new checkins row.
--
-- Tickets therefore never transition to 'USED' anymore — they stay
-- 'AVAILABLE' for the whole event and only 'CANCELLED' blocks entry
-- outright. Attendance history lives entirely in the checkins table
-- (one row per successful entry, so a 2-day event naturally produces up to
-- two rows per ticket).
-- ============================================================================
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
  v_existing_today checkins%rowtype;
  v_new_checkin checkins%rowtype;
begin
  select role into v_role from profiles where user_id = p_operator_id;
  if v_role is null or v_role not in ('ADMIN', 'CHECKIN') then
    raise exception 'FORBIDDEN: only checkin staff can confirm entry';
  end if;

  select * into v_ticket from tickets where id = p_ticket_id for update;
  if not found then
    return query select false, 'TICKET_NOT_FOUND', null::text, null::timestamptz;
    return;
  end if;

  if v_ticket.status = 'CANCELLED' then
    return query select false, 'TICKET_CANCELLED', v_ticket.ticket_number, null::timestamptz;
    return;
  end if;

  select * into v_existing_today
  from checkins c
  where c.ticket_id = p_ticket_id
    and (c.checked_in_at at time zone 'America/Manaus')::date = (now() at time zone 'America/Manaus')::date
  order by c.checked_in_at desc
  limit 1;

  if found then
    return query select false, 'ALREADY_CHECKED_IN_TODAY', v_ticket.ticket_number, v_existing_today.checked_in_at;
    return;
  end if;

  insert into checkins (ticket_id, event_id, checked_in_by, source, device_info, ip_address)
  values (p_ticket_id, v_ticket.event_id, p_operator_id, p_source, p_device_info, p_ip_address)
  returning * into v_new_checkin;

  return query select true, 'OK', v_ticket.ticket_number, v_new_checkin.checked_in_at;
end;
$$;
