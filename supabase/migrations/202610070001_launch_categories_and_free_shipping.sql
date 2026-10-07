-- Keep retired category records for historical orders, but remove them from use.
insert into public.categories (name, slug, is_active, sort_order) values
  ('Football', 'football', true, 10), ('Basketball', 'basketball', true, 20),
  ('Tennis', 'tennis', true, 30), ('Jerseys', 'jerseys', true, 40),
  ('Gym & Fitness', 'gym-fitness', true, 50), ('Accessories', 'accessories', true, 60),
  ('Lifestyle', 'lifestyle', true, 70)
on conflict (slug) do update set name = excluded.name, is_active = true, sort_order = excluded.sort_order;

update public.categories set is_active = false
where slug not in ('football', 'basketball', 'tennis', 'jerseys', 'gym-fitness', 'accessories', 'lifestyle');

alter table public.coupon_codes drop constraint if exists coupon_codes_type_check;
alter table public.coupon_codes add constraint coupon_codes_type_check check (type in ('percentage', 'fixed', 'free_shipping'));
alter table public.coupon_codes drop constraint if exists coupon_codes_value_check;
alter table public.coupon_codes add constraint coupon_codes_value_check check (
  (type = 'free_shipping' and value = 0) or (type in ('percentage', 'fixed') and value > 0)
);
