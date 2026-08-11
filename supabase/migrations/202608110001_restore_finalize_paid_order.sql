create or replace function public.finalize_paid_order(
  p_reference text,
  p_amount integer,
  p_currency text,
  p_channel text default null,
  p_gateway_response text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_order public.orders%rowtype;
  line record;
begin
  select * into target_order
  from public.orders
  where paystack_reference = p_reference
  for update;

  if target_order.id is null then
    raise exception 'Order not found for payment reference';
  end if;

  if target_order.total_amount <> p_amount or target_order.currency <> upper(p_currency) then
    raise exception 'Payment amount or currency mismatch';
  end if;

  if target_order.payment_status = 'paid' then
    return target_order.id;
  end if;

  for line in
    select order_items.*, product_variants.stock_quantity
    from public.order_items
    join public.product_variants on product_variants.id = order_items.variant_id
    where order_items.order_id = target_order.id
    for update of product_variants
  loop
    update public.product_variants
    set stock_quantity = stock_quantity - line.quantity,
        updated_at = now()
    where id = line.variant_id
      and is_active = true
      and stock_quantity >= line.quantity;

    if not found then
      raise exception 'Insufficient stock for %', line.product_name;
    end if;
  end loop;

  update public.payments
  set status = 'paid',
      channel = coalesce(p_channel, channel),
      gateway_response = coalesce(p_gateway_response, gateway_response),
      paid_at = coalesce(paid_at, now()),
      verified_at = coalesce(verified_at, now()),
      metadata = coalesce(metadata, '{}'::jsonb) || coalesce(p_metadata, '{}'::jsonb),
      updated_at = now()
  where provider_reference = p_reference;

  update public.orders
  set status = 'confirmed',
      payment_status = 'paid',
      fulfilment_status = 'unfulfilled',
      paid_at = coalesce(paid_at, now()),
      updated_at = now()
  where id = target_order.id;

  update public.carts
  set status = 'converted',
      updated_at = now()
  where user_id = target_order.user_id
    and status = 'active';

  return target_order.id;
end;
$$;

revoke all on function public.finalize_paid_order(text, integer, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.finalize_paid_order(text, integer, text, text, text, jsonb) to service_role;
