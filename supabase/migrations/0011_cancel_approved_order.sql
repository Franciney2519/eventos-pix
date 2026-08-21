-- ============================================================================
-- Lets an admin cancel a request/order that was already approved (e.g. a
-- duplicate submission that got mistakenly approved twice), not just
-- pending ones. reject_order() only accepts PENDING orders — this covers
-- the rest of the lifecycle by reusing the same REJECTED/CANCELLED fields
-- so it automatically frees up event capacity (capacity checks filter on
-- payment_status = 'APPROVED') and cancels any AVAILABLE tickets it issued.
-- Already-USED tickets are left alone — the person already got in.
-- ============================================================================
create or replace function cancel_order(p_order_id uuid, p_admin_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
begin
  if (select role from profiles where user_id = p_admin_id) <> 'ADMIN' then
    raise exception 'FORBIDDEN: only admins can cancel orders';
  end if;

  select * into v_order from orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if v_order.order_status = 'CANCELLED' then
    raise exception 'ORDER_ALREADY_CANCELLED';
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

  update tickets
  set status = 'CANCELLED', cancelled_at = now()
  where order_id = v_order.id and status = 'AVAILABLE';
end;
$$;
