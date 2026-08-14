-- Prepared after the live project audit found RLS disabled on the commerce tables.
-- Review and apply as one migration so policies exist as soon as RLS is enabled.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.is_admin_email(text) from public, anon, authenticated;

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

drop policy if exists "profiles self and admin read" on public.profiles;
create policy "profiles self and admin read" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "profiles self update non-admin" on public.profiles;
create policy "profiles self update non-admin" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and role = 'customer');

drop policy if exists "public reads active categories" on public.categories;
create policy "public reads active categories" on public.categories
  for select to anon, authenticated
  using (is_active);

drop policy if exists "admins manage categories" on public.categories;
create policy "admins manage categories" on public.categories
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "public reads active products" on public.products;
create policy "public reads active products" on public.products
  for select to anon, authenticated
  using (status = 'active');

drop policy if exists "admins manage products" on public.products;
create policy "admins manage products" on public.products
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "public reads active product images" on public.product_images;
create policy "public reads active product images" on public.product_images
  for select to anon, authenticated
  using (
    exists (select 1 from public.products p where p.id = product_id and p.status = 'active')
  );

drop policy if exists "admins manage product images" on public.product_images;
create policy "admins manage product images" on public.product_images
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "public reads active product variants" on public.product_variants;
create policy "public reads active product variants" on public.product_variants
  for select to anon, authenticated
  using (
    is_active and exists (select 1 from public.products p where p.id = product_id and p.status = 'active')
  );

drop policy if exists "admins manage product variants" on public.product_variants;
create policy "admins manage product variants" on public.product_variants
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "owners manage addresses" on public.addresses;
create policy "owners manage addresses" on public.addresses
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "admins read addresses" on public.addresses;
create policy "admins read addresses" on public.addresses
  for select to authenticated using ((select public.is_admin()));

drop policy if exists "owners manage authenticated carts" on public.carts;
create policy "owners manage authenticated carts" on public.carts
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "owners manage cart items" on public.cart_items;
create policy "owners manage cart items" on public.cart_items
  for all to authenticated
  using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())))
  with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())));

drop policy if exists "public reads active delivery zones" on public.delivery_zones;
create policy "public reads active delivery zones" on public.delivery_zones
  for select to anon, authenticated
  using (is_active);

drop policy if exists "admins manage delivery zones" on public.delivery_zones;
create policy "admins manage delivery zones" on public.delivery_zones
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "owners and admins read orders" on public.orders;
create policy "owners and admins read orders" on public.orders
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "admins update orders" on public.orders;
create policy "admins update orders" on public.orders
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "owners and admins read order items" on public.order_items;
create policy "owners and admins read order items" on public.order_items
  for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_id and (o.user_id = (select auth.uid()) or (select public.is_admin()))
  ));

drop policy if exists "owners and admins read payments" on public.payments;
create policy "owners and admins read payments" on public.payments
  for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_id and (o.user_id = (select auth.uid()) or (select public.is_admin()))
  ));

drop policy if exists "admins read payment events" on public.payment_events;
create policy "admins read payment events" on public.payment_events
  for select to authenticated using ((select public.is_admin()));

drop policy if exists "public reads site content" on public.site_content;
create policy "public reads site content" on public.site_content
  for select to anon, authenticated using (true);

drop policy if exists "admins manage site content" on public.site_content;
create policy "admins manage site content" on public.site_content
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
