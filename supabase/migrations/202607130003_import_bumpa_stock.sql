-- Imports current FITS Bumpa catalogue stock captured from https://fits.bumpa.shop/?page=1..3.
-- Keeps data repeatable by using stable product slugs and SKUs.

insert into public.categories (name, slug, description, sort_order)
values
  ('Football', 'football', 'Football training products, matchday equipment and accessories.', 10),
  ('More', 'more', 'Other FITS sports products and campus essentials.', 20)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();

with product_seed as (
  select * from (values
    ('Studless Soccer Boots', 'studless-soccer-boots', 'Studless soccer boots from the current FITS Bumpa stock.', 'Imported from FITS Bumpa stock.', 'more', 57000, 60000, true, 'active'::public.product_status),
    ('Training Bips', 'training-bips', 'Training bips from the current FITS Bumpa stock.', 'Imported from FITS Bumpa stock.', 'more', 15000, null::integer, true, 'active'::public.product_status),
    ('Jump Rope', 'jump-rope', 'Jump rope with selectable options. Bumpa listed price range: ₦7,500 - ₦9,500.', 'Imported from FITS Bumpa stock.', 'more', 7500, null::integer, false, 'active'::public.product_status),
    ('Adidas Sport Socks', 'adidas-sport-socks', 'Adidas sport socks from the current FITS Bumpa stock.', 'Imported from FITS Bumpa stock.', 'more', 2500, null::integer, false, 'active'::public.product_status),
    ('Cut Hose', 'cut-hose', 'Cut hose from the current FITS Bumpa stock.', 'Imported from FITS Bumpa stock.', 'more', 4000, null::integer, false, 'active'::public.product_status),
    ('Hose Socks', 'hose-socks', 'Discounted hose socks from the current FITS Bumpa stock.', 'Imported from FITS Bumpa stock.', 'more', 2000, 3000, false, 'active'::public.product_status),
    ('Plain Black socks', 'plain-black-socks', 'Plain black socks from the current FITS Bumpa stock.', 'Imported from FITS Bumpa stock.', 'more', 800, 850, false, 'active'::public.product_status),
    ('Drawstring backpack (knapsack)', 'drawstring-backpack-knapsack', 'Drawstring backpack for training, class and matchday carry.', 'Imported from FITS Bumpa stock.', 'football', 2500, null::integer, false, 'active'::public.product_status),
    ('Tennis Ball', 'tennis-ball', 'Tennis ball from the current FITS Bumpa stock.', 'Currently out of stock on Bumpa.', 'more', 2500, null::integer, false, 'active'::public.product_status),
    ('Sport Shorts', 'sport-shorts', 'Sport shorts from the current FITS Bumpa stock.', 'Imported from FITS Bumpa stock.', 'football', 6000, null::integer, true, 'active'::public.product_status),
    ('Whistle', 'whistle', 'Training whistle from the current FITS Bumpa stock.', 'Imported from FITS Bumpa stock.', 'football', 2500, null::integer, false, 'active'::public.product_status),
    ('Rugby Ball', 'rugby-ball', 'Rugby ball from the current FITS Bumpa stock.', 'Currently out of stock on Bumpa.', 'more', 15000, null::integer, false, 'active'::public.product_status),
    ('Badmington Racket', 'badmington-racket', 'Badmington racket from the current FITS Bumpa stock.', 'Currently out of stock on Bumpa.', 'more', 15000, null::integer, false, 'active'::public.product_status),
    ('Tennis Racket', 'tennis-racket', 'Tennis racket from the current FITS Bumpa stock.', 'Currently out of stock on Bumpa.', 'more', 20000, null::integer, false, 'active'::public.product_status),
    ('Volleyball', 'volleyball', 'Volleyball from the current FITS Bumpa stock.', 'Currently out of stock on Bumpa.', 'more', 10000, null::integer, false, 'active'::public.product_status),
    ('Ankle Support', 'ankle-support', 'Ankle support from the current FITS Bumpa stock.', 'Currently out of stock on Bumpa.', 'football', 5000, null::integer, false, 'active'::public.product_status),
    ('Wrist Bands', 'wrist-bands', 'Wrist bands from the current FITS Bumpa stock.', 'Currently out of stock on Bumpa.', 'football', 5000, null::integer, false, 'active'::public.product_status),
    ('Grip Socks', 'grip-socks', 'Grip socks from the current FITS Bumpa stock. Bumpa listed price range: ₦5,500 - ₦6,500.', 'Currently out of stock on Bumpa.', 'football', 5500, null::integer, false, 'active'::public.product_status),
    ('Knee Sleeves', 'knee-sleeves', 'Knee sleeves from the current FITS Bumpa stock.', 'Currently out of stock on Bumpa.', 'football', 7000, null::integer, false, 'active'::public.product_status),
    ('Arm Sleeves', 'arm-sleeves', 'Arm sleeves from the current FITS Bumpa stock.', 'Currently out of stock on Bumpa.', 'more', 4000, null::integer, false, 'active'::public.product_status),
    ('Goal keeping Gloves (Football)', 'goal-keeping-gloves-football', 'Goal keeping gloves from the current FITS Bumpa stock.', 'Currently out of stock on Bumpa.', 'football', 10000, null::integer, false, 'active'::public.product_status),
    ('Spalding Basketball', 'spalding-basketball', 'Discounted Spalding basketball from the current FITS Bumpa stock.', 'Imported from FITS Bumpa stock.', 'more', 18000, 20000, true, 'active'::public.product_status),
    ('Soccer ball', 'soccer-ball', 'Soccer ball from the current FITS Bumpa stock. Bumpa listed comparison range: ₦15,500 - ₦18,500.', 'Currently out of stock on Bumpa.', 'football', 18000, 18500, false, 'active'::public.product_status),
    ('Nike sport Socks', 'nike-sport-socks', 'Discounted Nike sport socks from the current FITS Bumpa stock.', 'Imported from FITS Bumpa stock.', 'football', 2000, 2300, false, 'active'::public.product_status),
    ('Cone (50 pcs)', 'cone-50-pcs', 'Pack of 50 training cones from the current FITS Bumpa stock.', 'Imported from FITS Bumpa stock.', 'football', 15000, null::integer, false, 'active'::public.product_status)
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

with image_seed as (
  select * from (values
    ('studless-soccer-boots', '/bumpa-products/studless-soccer-boots.jpg'),
    ('training-bips', '/bumpa-products/training-bips.jpg'),
    ('jump-rope', '/bumpa-products/jump-rope.jpg'),
    ('adidas-sport-socks', '/bumpa-products/adidas-sport-socks.jpg'),
    ('cut-hose', '/bumpa-products/cut-hose.jpg'),
    ('hose-socks', '/bumpa-products/hose-socks.jpg'),
    ('plain-black-socks', '/bumpa-products/plain-black-socks.jpg'),
    ('drawstring-backpack-knapsack', '/bumpa-products/drawstring-backpack-knapsack.jpg'),
    ('tennis-ball', '/bumpa-products/tennis-ball.jpg'),
    ('sport-shorts', '/bumpa-products/sport-shorts.png'),
    ('whistle', '/bumpa-products/whistle.jpg'),
    ('rugby-ball', '/bumpa-products/rugby-ball.jpg'),
    ('badmington-racket', '/bumpa-products/badmington-racket.jpg'),
    ('tennis-racket', '/bumpa-products/tennis-racket.jpg'),
    ('volleyball', '/bumpa-products/volleyball.jpg'),
    ('ankle-support', '/bumpa-products/ankle-support.jpg'),
    ('wrist-bands', '/bumpa-products/wrist-bands.jpg'),
    ('grip-socks', '/bumpa-products/grip-socks.jpg'),
    ('knee-sleeves', '/bumpa-products/knee-sleeves.jpg'),
    ('arm-sleeves', '/bumpa-products/arm-sleeves.jpg'),
    ('goal-keeping-gloves-football', '/bumpa-products/goal-keeping-gloves-football.jpg'),
    ('spalding-basketball', '/bumpa-products/spalding-basketball.jpg'),
    ('soccer-ball', '/bumpa-products/soccer-ball.jpg'),
    ('nike-sport-socks', '/bumpa-products/nike-sport-socks.jpg'),
    ('cone-50-pcs', '/bumpa-products/cone-50-pcs.jpg')
  ) as t(product_slug, image_url)
),
deleted as (
  delete from public.product_images
  using public.products, image_seed
  where product_images.product_id = products.id
    and products.slug = image_seed.product_slug
  returning product_images.id
)
insert into public.product_images (product_id, image_url, alt_text, sort_order, is_primary)
select products.id, image_seed.image_url, products.name || ' product image', 0, true
from image_seed
join public.products on products.slug = image_seed.product_slug;

with variant_seed as (
  select * from (values
    ('studless-soccer-boots', 'BUMPA-STUDLESS-SOCCER-BOOTS-OS', 'One Size', 'Default', 8),
    ('training-bips', 'BUMPA-TRAINING-BIPS-OS', 'One Size', 'Default', 12),
    ('jump-rope', 'BUMPA-JUMP-ROPE-STANDARD', 'Standard', 'Default', 6),
    ('jump-rope', 'BUMPA-JUMP-ROPE-PREMIUM', 'Premium', 'Default', 6),
    ('adidas-sport-socks', 'BUMPA-ADIDAS-SPORT-SOCKS-OS', 'One Size', 'Default', 12),
    ('cut-hose', 'BUMPA-CUT-HOSE-OS', 'One Size', 'Default', 10),
    ('hose-socks', 'BUMPA-HOSE-SOCKS-OS', 'One Size', 'Default', 10),
    ('plain-black-socks', 'BUMPA-PLAIN-BLACK-SOCKS-OS', 'One Size', 'Default', 15),
    ('drawstring-backpack-knapsack', 'BUMPA-DRAWSTRING-BACKPACK-KNAPSACK-OS', 'One Size', 'Default', 10),
    ('tennis-ball', 'BUMPA-TENNIS-BALL-OS', 'One Size', 'Default', 0),
    ('sport-shorts', 'BUMPA-SPORT-SHORTS-M', 'M', 'Default', 3),
    ('sport-shorts', 'BUMPA-SPORT-SHORTS-L', 'L', 'Default', 3),
    ('sport-shorts', 'BUMPA-SPORT-SHORTS-XL', 'XL', 'Default', 2),
    ('whistle', 'BUMPA-WHISTLE-OS', 'One Size', 'Default', 10),
    ('rugby-ball', 'BUMPA-RUGBY-BALL-OS', 'One Size', 'Default', 0),
    ('badmington-racket', 'BUMPA-BADMINGTON-RACKET-OS', 'One Size', 'Default', 0),
    ('tennis-racket', 'BUMPA-TENNIS-RACKET-OS', 'One Size', 'Default', 0),
    ('volleyball', 'BUMPA-VOLLEYBALL-OS', 'One Size', 'Default', 0),
    ('ankle-support', 'BUMPA-ANKLE-SUPPORT-OS', 'One Size', 'Default', 0),
    ('wrist-bands', 'BUMPA-WRIST-BANDS-OS', 'One Size', 'Default', 0),
    ('grip-socks', 'BUMPA-GRIP-SOCKS-STANDARD', 'Standard', 'Default', 0),
    ('grip-socks', 'BUMPA-GRIP-SOCKS-PREMIUM', 'Premium', 'Default', 0),
    ('knee-sleeves', 'BUMPA-KNEE-SLEEVES-OS', 'One Size', 'Default', 0),
    ('arm-sleeves', 'BUMPA-ARM-SLEEVES-OS', 'One Size', 'Default', 0),
    ('goal-keeping-gloves-football', 'BUMPA-GOAL-KEEPING-GLOVES-FOOTBALL-OS', 'One Size', 'Default', 0),
    ('spalding-basketball', 'BUMPA-SPALDING-BASKETBALL-OS', 'One Size', 'Default', 8),
    ('soccer-ball', 'BUMPA-SOCCER-BALL-OS', 'One Size', 'Default', 0),
    ('nike-sport-socks', 'BUMPA-NIKE-SPORT-SOCKS-OS', 'One Size', 'Default', 12),
    ('cone-50-pcs', 'BUMPA-CONE-50-PCS', '50 pcs', 'Default', 10)
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

update public.products
set status = 'archived'::public.product_status,
    updated_at = now()
where slug in (
  'fits-core-jersey',
  'monochrome-track-set',
  'f4l-heavyweight-tee',
  'match-day-shorts',
  'club-essential-cap',
  'away-knit-jersey',
  'tunnel-walk-jacket',
  'training-mesh-vest',
  'campus-carry-tote',
  'blackout-warmup-top',
  'sideline-cargo-shorts',
  'archive-scarf',
  'sold-out-sample-jersey'
);
