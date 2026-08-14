alter table public.orders
  add column if not exists fulfilled_at timestamptz;

create or replace function public.sync_order_fulfilment_state()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'delivered' and new.fulfilment_status <> 'delivered' then
    new.fulfilment_status := 'delivered';
  end if;

  if new.fulfilment_status in ('processing', 'shipped', 'delivered')
     and new.payment_status <> 'paid' then
    raise exception 'Only paid orders can enter fulfilment';
  end if;

  case new.fulfilment_status
    when 'processing' then new.status := 'processing';
    when 'shipped' then new.status := 'shipped';
    when 'delivered' then new.status := 'delivered';
    when 'cancelled' then new.status := 'cancelled';
    when 'unfulfilled' then
      if new.payment_status = 'paid' and new.status not in ('cancelled', 'refunded') then
        new.status := 'confirmed';
      end if;
  end case;

  if new.fulfilment_status = 'delivered' then
    new.fulfilled_at := coalesce(old.fulfilled_at, now());
  else
    new.fulfilled_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists orders_sync_fulfilment_state on public.orders;
create trigger orders_sync_fulfilment_state
before update of status, fulfilment_status, payment_status on public.orders
for each row execute function public.sync_order_fulfilment_state();

create index if not exists orders_fulfilment_created_idx
  on public.orders (fulfilment_status, created_at desc);

comment on column public.orders.fulfilled_at is
  'Time the order was marked delivered. Maintained automatically by orders_sync_fulfilment_state.';
