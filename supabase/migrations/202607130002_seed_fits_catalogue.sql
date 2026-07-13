-- Repeatable development seed data for FITS.
-- Uses stable slugs/SKUs and upserts to avoid uncontrolled duplicates.

insert into public.categories (name, slug, description, sort_order)
values
  ('Jerseys', 'jerseys', 'Football-inspired jerseys for matchday and everyday wear.', 10),
  ('Sets', 'sets', 'Complete coordinated fits.', 20),
  ('T-Shirts', 't-shirts', 'Heavyweight everyday tees.', 30),
  ('Shorts', 'shorts', 'Lightweight technical shorts.', 40),
  ('Accessories', 'accessories', 'Caps, bags and finishing details.', 50)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();

with product_seed as (
  select * from (values
    ('FITS Core Jersey', 'fits-core-jersey', 'A relaxed performance jersey cut for movement and everyday wear.', 'Core football jersey with breathable comfort.', 'jerseys', 38000, null::integer, true, 'active'::public.product_status),
    ('Monochrome Track Set', 'monochrome-track-set', 'Structured two-piece track set with a clean monochrome finish.', 'A complete campus-ready set.', 'sets', 65000, 72000, true, 'active'::public.product_status),
    ('F4L Heavyweight Tee', 'f4l-heavyweight-tee', 'Premium heavyweight cotton with an oversized silhouette.', 'Daily tee with a strong FITS block.', 't-shirts', 28000, null::integer, true, 'active'::public.product_status),
    ('Match Day Shorts', 'match-day-shorts', 'Lightweight technical shorts made for match day and beyond.', 'Shorts built for heat and movement.', 'shorts', 24000, null::integer, false, 'active'::public.product_status),
    ('Club Essential Cap', 'club-essential-cap', 'Six-panel cotton cap with understated FITS detailing.', 'Everyday accessory for the full fit.', 'accessories', 18000, null::integer, false, 'active'::public.product_status),
    ('Away Knit Jersey', 'away-knit-jersey', 'Breathable knit jersey with contrast collar and relaxed fit.', 'A softer away-day jersey.', 'jerseys', 42000, 48000, false, 'active'::public.product_status),
    ('Tunnel Walk Jacket', 'tunnel-walk-jacket', 'Lightweight layer for tunnel walks, travel days and cool evenings.', 'Outer layer with matchday energy.', 'sets', 58000, null::integer, true, 'active'::public.product_status),
    ('Training Mesh Vest', 'training-mesh-vest', 'Open mesh training vest with oversized armholes.', 'Warm-weather training layer.', 't-shirts', 22000, null::integer, false, 'active'::public.product_status),
    ('Campus Carry Tote', 'campus-carry-tote', 'Durable tote for books, boots and daily essentials.', 'A FITS bag for campus days.', 'accessories', 16000, null::integer, false, 'active'::public.product_status),
    ('Blackout Warmup Top', 'blackout-warmup-top', 'Long-sleeve warmup top with a sharp blackout finish.', 'Warmup layer for colder evenings.', 'jerseys', 46000, 52000, true, 'active'::public.product_status),
    ('Sideline Cargo Shorts', 'sideline-cargo-shorts', 'Relaxed cargo shorts with utility pockets and clean branding.', 'Utility shorts for off-pitch movement.', 'shorts', 32000, null::integer, false, 'active'::public.product_status),
    ('Archive Scarf', 'archive-scarf', 'Supporter-inspired knit scarf for the FITS community.', 'Limited supporter scarf.', 'accessories', 20000, null::integer, false, 'active'::public.product_status),
    ('Sold Out Sample Jersey', 'sold-out-sample-jersey', 'A sample product used to verify out-of-stock behaviour.', 'Out-of-stock test product.', 'jerseys', 30000, null::integer, false, 'active'::public.product_status)
  ) as t(name, slug, description, short_description, category_slug, base_price, compare_at_price, featured, status)
)
insert into public.products (
  name, slug, description, short_description, category_id, base_price, compare_at_price, featured, status
)
select
  product_seed.name,
  product_seed.slug,
  product_seed.description,
  product_seed.short_description,
  categories.id,
  product_seed.base_price,
  product_seed.compare_at_price,
  product_seed.featured,
  product_seed.status
from product_seed
join public.categories on categories.slug = product_seed.category_slug
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  short_description = excluded.short_description,
  category_id = excluded.category_id,
  base_price = excluded.base_price,
  compare_at_price = excluded.compare_at_price,
  featured = excluded.featured,
  status = excluded.status,
  updated_at = now();

insert into public.product_images (product_id, image_url, alt_text, sort_order, is_primary)
select
  products.id,
  case categories.slug
    when 'jerseys' then '/stock/jersey-man.jpg'
    when 'sets' then '/stock/football-style.jpg'
    when 'accessories' then '/stock/jersey-detail.jpg'
    when 'shorts' then '/stock/streetwear-jersey.jpg'
    else '/stock/football-portrait.jpg'
  end,
  products.name || ' product image',
  0,
  true
from public.products
left join public.categories on categories.id = products.category_id
where not exists (
  select 1 from public.product_images
  where product_images.product_id = products.id and product_images.is_primary = true
);

with variant_seed as (
  select * from (values
    ('fits-core-jersey', 'FITS-JER-CORE-S', 'S', 'Black', 18),
    ('fits-core-jersey', 'FITS-JER-CORE-M', 'M', 'Black', 18),
    ('fits-core-jersey', 'FITS-JER-CORE-L', 'L', 'Black', 12),
    ('fits-core-jersey', 'FITS-JER-CORE-XL', 'XL', 'Black', 6),
    ('monochrome-track-set', 'FITS-SET-MONO-M', 'M', 'Black', 9),
    ('monochrome-track-set', 'FITS-SET-MONO-L', 'L', 'Black', 7),
    ('monochrome-track-set', 'FITS-SET-MONO-XL', 'XL', 'Black', 4),
    ('f4l-heavyweight-tee', 'FITS-TEE-F4L-S', 'S', 'White', 24),
    ('f4l-heavyweight-tee', 'FITS-TEE-F4L-M', 'M', 'White', 24),
    ('f4l-heavyweight-tee', 'FITS-TEE-F4L-L', 'L', 'White', 18),
    ('f4l-heavyweight-tee', 'FITS-TEE-F4L-XL', 'XL', 'White', 10),
    ('match-day-shorts', 'FITS-SHO-MATCH-M', 'M', 'Black', 14),
    ('match-day-shorts', 'FITS-SHO-MATCH-L', 'L', 'Black', 12),
    ('club-essential-cap', 'FITS-ACC-CAP-OS', 'One Size', 'Black', 20),
    ('away-knit-jersey', 'FITS-JER-AWAY-M', 'M', 'Cream', 7),
    ('away-knit-jersey', 'FITS-JER-AWAY-L', 'L', 'Cream', 5),
    ('tunnel-walk-jacket', 'FITS-SET-TUNNEL-M', 'M', 'Black', 8),
    ('tunnel-walk-jacket', 'FITS-SET-TUNNEL-L', 'L', 'Black', 6),
    ('training-mesh-vest', 'FITS-TEE-MESH-M', 'M', 'Volt', 16),
    ('training-mesh-vest', 'FITS-TEE-MESH-L', 'L', 'Volt', 12),
    ('campus-carry-tote', 'FITS-ACC-TOTE-OS', 'One Size', 'Natural', 15),
    ('blackout-warmup-top', 'FITS-JER-BLACKOUT-M', 'M', 'Black', 5),
    ('blackout-warmup-top', 'FITS-JER-BLACKOUT-L', 'L', 'Black', 3),
    ('sideline-cargo-shorts', 'FITS-SHO-CARGO-M', 'M', 'Olive', 8),
    ('sideline-cargo-shorts', 'FITS-SHO-CARGO-L', 'L', 'Olive', 6),
    ('archive-scarf', 'FITS-ACC-SCARF-OS', 'One Size', 'Black/Volt', 9),
    ('sold-out-sample-jersey', 'FITS-JER-SOLDOUT-M', 'M', 'Red', 0)
  ) as t(product_slug, sku, size, colour, stock_quantity)
)
insert into public.product_variants (product_id, sku, size, colour, stock_quantity, low_stock_threshold, is_active)
select products.id, variant_seed.sku, variant_seed.size, variant_seed.colour, variant_seed.stock_quantity, 3, true
from variant_seed
join public.products on products.slug = variant_seed.product_slug
on conflict (sku) do update set
  size = excluded.size,
  colour = excluded.colour,
  stock_quantity = excluded.stock_quantity,
  is_active = true,
  updated_at = now();

insert into public.delivery_zones (name, state, city, fee, free_delivery_threshold, sort_order)
values
  ('Covenant University Pickup', 'Ogun', 'Ota', 1000, 100000, 10),
  ('Lagos Standard', 'Lagos', null, 2500, 120000, 20),
  ('Nigeria Standard', null, null, 4000, 150000, 30)
on conflict do nothing;
