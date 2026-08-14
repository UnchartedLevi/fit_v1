create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create or replace function private.is_admin()
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

revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated, service_role;

alter policy "profiles self and admin read" on public.profiles
  using (id = (select auth.uid()) or (select private.is_admin()));
alter policy "admins manage categories" on public.categories
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "admins manage products" on public.products
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "admins manage product images" on public.product_images
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "admins manage product variants" on public.product_variants
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "admins read addresses" on public.addresses
  using ((select private.is_admin()));
alter policy "admins manage delivery zones" on public.delivery_zones
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "owners and admins read orders" on public.orders
  using (user_id = (select auth.uid()) or (select private.is_admin()));
alter policy "admins update orders" on public.orders
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "owners and admins read order items" on public.order_items
  using (exists (
    select 1 from public.orders o
    where o.id = order_id and (o.user_id = (select auth.uid()) or (select private.is_admin()))
  ));
alter policy "owners and admins read payments" on public.payments
  using (exists (
    select 1 from public.orders o
    where o.id = order_id and (o.user_id = (select auth.uid()) or (select private.is_admin()))
  ));
alter policy "admins read payment events" on public.payment_events
  using ((select private.is_admin()));
alter policy "admins manage site content" on public.site_content
  using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "admins read admin allowlist" on public.admin_allowlist;
alter policy "admins manage admin allowlist" on public.admin_allowlist
  to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

drop function if exists public.is_admin();
