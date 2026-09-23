-- 202609230001_sbu_categories_shipping_coupons.sql
-- Migration: Add SBU flag, multi-categories, shipping methods and coupon codes

-- 1. SBU & Category arrays on products
alter table if exists public.products
  add column if not exists is_sbu boolean not null default false;

alter table if exists public.products
  add column if not exists category_ids uuid[] default '{}';

-- 2. Multi-category relationship table
create table if not exists public.product_categories (
  product_id uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (product_id, category_id)
);

create index if not exists idx_product_categories_category_id on public.product_categories(category_id);
create index if not exists idx_product_categories_product_id on public.product_categories(product_id);

-- 3. Upsert core categories
insert into public.categories (name, slug, description, is_active, sort_order)
values
  ('Football', 'football', 'Football boots, balls, kits and matchday gear.', true, 10),
  ('Basketball', 'basketball', 'Basketballs, hoops gear and court essentials.', true, 20),
  ('Gym & Fitness', 'gym-fitness', 'Training sets, gym wear and performance gear.', true, 30),
  ('Jerseys', 'jerseys', 'Performance jerseys made for the pitch and campus.', true, 40),
  ('Accessories', 'accessories', 'Caps, socks, bags and finishing details.', true, 50),
  ('Bundles', 'bundles', 'Coordinated sets and bundled value packs.', true, 60),
  ('Fashion & Lifestyle', 'fashion-lifestyle', 'Off-pitch lifestyle wear and campus street style.', true, 70)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  is_active = true,
  sort_order = excluded.sort_order;

-- 4. Shipping Methods table
create table if not exists public.shipping_methods (
  id uuid primary key default gen_random_uuid(),
  zone_name text not null,
  description text not null default '',
  price integer not null default 0 check (price >= 0),
  eta text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed initial shipping methods if empty
insert into public.shipping_methods (zone_name, description, price, eta, is_active, sort_order)
select 'Covenant University Campus', 'Direct delivery to your hall or room', 1000, 'Same day (within 2-4 hours)', true, 10
where not exists (select 1 from public.shipping_methods where zone_name = 'Covenant University Campus');

insert into public.shipping_methods (zone_name, description, price, eta, is_active, sort_order)
select 'Lagos Mainland & Island', 'Doorstep delivery across Lagos', 2500, '1-2 Business Days', true, 20
where not exists (select 1 from public.shipping_methods where zone_name = 'Lagos Mainland & Island');

insert into public.shipping_methods (zone_name, description, price, eta, is_active, sort_order)
select 'Nationwide Courier', 'Fast delivery anywhere in Nigeria', 4000, '2-4 Business Days', true, 30
where not exists (select 1 from public.shipping_methods where zone_name = 'Nationwide Courier');

-- 5. Coupon Codes table
create table if not exists public.coupon_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null check (type in ('percentage', 'fixed')),
  value integer not null check (value > 0),
  min_spend integer not null default 0 check (min_spend >= 0),
  is_active boolean not null default true,
  times_used integer not null default 0 check (times_used >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed initial coupons if empty
insert into public.coupon_codes (code, type, value, min_spend, is_active)
select 'FITS10', 'percentage', 10, 0, true
where not exists (select 1 from public.coupon_codes where code = 'FITS10');

insert into public.coupon_codes (code, type, value, min_spend, is_active)
select 'WELCOME2000', 'fixed', 2000, 10000, true
where not exists (select 1 from public.coupon_codes where code = 'WELCOME2000');

-- 6. RLS & Permissions
alter table public.product_categories enable row level security;
alter table public.shipping_methods enable row level security;
alter table public.coupon_codes enable row level security;

-- Public can read product categories
create policy "public_read_product_categories" on public.product_categories
  for select using (true);

-- Admin can manage product categories
create policy "admin_manage_product_categories" on public.product_categories
  for all using (public.is_admin()) with check (public.is_admin());

-- Public can read active shipping methods
create policy "public_read_shipping_methods" on public.shipping_methods
  for select using (is_active or public.is_admin());

-- Admin can manage shipping methods
create policy "admin_manage_shipping_methods" on public.shipping_methods
  for all using (public.is_admin()) with check (public.is_admin());

-- Public can read active coupons (or validation endpoint)
create policy "public_read_coupon_codes" on public.coupon_codes
  for select using (is_active or public.is_admin());

-- Admin can manage coupon codes
create policy "admin_manage_coupon_codes" on public.coupon_codes
  for all using (public.is_admin()) with check (public.is_admin());

grant select on public.product_categories to anon, authenticated;
grant all on public.product_categories to service_role;

grant select on public.shipping_methods to anon, authenticated;
grant all on public.shipping_methods to service_role;

grant select on public.coupon_codes to anon, authenticated;
grant all on public.coupon_codes to service_role;
