-- FITS commerce MVP schema
-- Apply to a fresh Supabase project. This migration is intentionally explicit so it is reproducible.

create extension if not exists "pgcrypto";

create type public.user_role as enum ('customer', 'admin');
create type public.product_status as enum ('draft', 'active', 'archived');
create type public.cart_status as enum ('active', 'converted', 'abandoned');
create type public.order_status as enum ('pending_payment', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
create type public.payment_status as enum ('unpaid', 'pending', 'paid', 'failed', 'refunded');
create type public.fulfilment_status as enum ('unfulfilled', 'processing', 'shipped', 'delivered', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  short_description text,
  brand text not null default 'FITS',
  category_id uuid references public.categories(id) on delete set null,
  base_price integer not null check (base_price >= 0),
  compare_at_price integer check (compare_at_price is null or compare_at_price >= 0),
  currency text not null default 'NGN' check (currency = upper(currency)),
  status public.product_status not null default 'draft',
  featured boolean not null default false,
  average_rating numeric(3,2) not null default 0 check (average_rating >= 0 and average_rating <= 5),
  review_count integer not null default 0 check (review_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  size text,
  colour text,
  option_values jsonb not null default '{}'::jsonb,
  price_override integer check (price_override is null or price_override >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  low_stock_threshold integer not null default 3 check (low_stock_threshold >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipient_name text not null,
  phone text not null,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  state text not null,
  country text not null default 'Nigeria',
  postal_code text,
  delivery_instructions text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  session_id text,
  status public.cart_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint carts_owner_check check (user_id is not null or session_id is not null)
);

create unique index carts_one_active_user_cart_idx
  on public.carts(user_id)
  where user_id is not null and status = 'active';

create unique index carts_one_active_session_cart_idx
  on public.carts(session_id)
  where session_id is not null and status = 'active';

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, product_id, variant_id)
);

create table public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  state text,
  city text,
  fee integer not null default 0 check (fee >= 0),
  free_delivery_threshold integer check (free_delivery_threshold is null or free_delivery_threshold >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  customer_email text not null,
  customer_phone text not null,
  status public.order_status not null default 'pending_payment',
  payment_status public.payment_status not null default 'unpaid',
  fulfilment_status public.fulfilment_status not null default 'unfulfilled',
  currency text not null default 'NGN' check (currency = upper(currency)),
  subtotal integer not null default 0 check (subtotal >= 0),
  discount_amount integer not null default 0 check (discount_amount >= 0),
  delivery_fee integer not null default 0 check (delivery_fee >= 0),
  tax_amount integer not null default 0 check (tax_amount >= 0),
  total_amount integer not null default 0 check (total_amount >= 0),
  delivery_address_snapshot jsonb not null,
  customer_note text,
  paystack_reference text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  variant_description text,
  sku text,
  image_url text,
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total integer not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null default 'paystack',
  provider_reference text not null unique,
  amount integer not null check (amount >= 0),
  currency text not null default 'NGN' check (currency = upper(currency)),
  status public.payment_status not null default 'pending',
  channel text,
  gateway_response text,
  paid_at timestamptz,
  verified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'paystack',
  event_id text not null,
  provider_reference text,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, event_id)
);

create table public.site_content (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories for each row execute procedure public.set_updated_at();
create trigger products_set_updated_at before update on public.products for each row execute procedure public.set_updated_at();
create trigger product_variants_set_updated_at before update on public.product_variants for each row execute procedure public.set_updated_at();
create trigger addresses_set_updated_at before update on public.addresses for each row execute procedure public.set_updated_at();
create trigger carts_set_updated_at before update on public.carts for each row execute procedure public.set_updated_at();
create trigger cart_items_set_updated_at before update on public.cart_items for each row execute procedure public.set_updated_at();
create trigger delivery_zones_set_updated_at before update on public.delivery_zones for each row execute procedure public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders for each row execute procedure public.set_updated_at();
create trigger payments_set_updated_at before update on public.payments for each row execute procedure public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.generate_order_number()
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  loop
    candidate := 'FITS-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 6));
    exit when not exists (select 1 from public.orders where order_number = candidate);
  end loop;
  return candidate;
end;
$$;

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

create index categories_active_sort_idx on public.categories(is_active, sort_order, name);
create index products_status_featured_idx on public.products(status, featured, created_at desc);
create index products_category_idx on public.products(category_id);
create index product_images_product_sort_idx on public.product_images(product_id, sort_order);
create index product_variants_product_active_idx on public.product_variants(product_id, is_active);
create index product_variants_size_colour_idx on public.product_variants(size, colour);
create index products_search_idx on public.products
  using gin (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(brand, '')));
create index cart_items_cart_idx on public.cart_items(cart_id);
create index addresses_user_idx on public.addresses(user_id);
create unique index addresses_one_default_per_user_idx on public.addresses(user_id)
  where is_default = true;
create index orders_user_created_idx on public.orders(user_id, created_at desc);
create index orders_status_created_idx on public.orders(status, created_at desc);
create index payments_order_idx on public.payments(order_id);
create index payment_events_reference_idx on public.payment_events(provider_reference);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.addresses enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;
alter table public.site_content enable row level security;

create policy "profiles self and admin read" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy "profiles self update non-admin" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

create policy "public reads active categories" on public.categories
  for select using (is_active or public.is_admin());

create policy "admins manage categories" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

create policy "public reads active products" on public.products
  for select using (status = 'active' or public.is_admin());

create policy "admins manage products" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

create policy "public reads active product images" on public.product_images
  for select using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.status = 'active'
    ) or public.is_admin()
  );

create policy "admins manage product images" on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());

create policy "public reads active product variants" on public.product_variants
  for select using (
    is_active and exists (
      select 1 from public.products p
      where p.id = product_id and p.status = 'active'
    ) or public.is_admin()
  );

create policy "admins manage product variants" on public.product_variants
  for all using (public.is_admin()) with check (public.is_admin());

create policy "owners manage addresses" on public.addresses
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "admins read addresses" on public.addresses
  for select using (public.is_admin());

create policy "owners manage authenticated carts" on public.carts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "owners manage cart items" on public.cart_items
  for all using (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
  );

create policy "public reads active delivery zones" on public.delivery_zones
  for select using (is_active or public.is_admin());

create policy "admins manage delivery zones" on public.delivery_zones
  for all using (public.is_admin()) with check (public.is_admin());

create policy "owners and admins read orders" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());

create policy "admins update orders" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

create policy "owners and admins read order items" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "owners and admins read payments" on public.payments
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "admins read payment events" on public.payment_events
  for select using (public.is_admin());

create policy "public reads site content" on public.site_content
  for select using (true);

create policy "admins manage site content" on public.site_content
  for all using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "public product image access" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "admins upload product images" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());

create policy "admins update product images" on storage.objects
  for update using (bucket_id = 'product-images' and public.is_admin());

create policy "admins delete product images" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());


