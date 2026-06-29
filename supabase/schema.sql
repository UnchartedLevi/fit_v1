-- FITS Supabase schema. Run once in Supabase SQL Editor.
create extension if not exists "pgcrypto";
create type public.user_role as enum ('customer','admin');
create type public.payment_state as enum ('pending','paid','failed','refunded');
create type public.order_state as enum ('pending','processing','fulfilled','cancelled');

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text, phone text, role public.user_role not null default 'customer',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.products (
 id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
 description text not null default '', price integer not null check(price>=0), category text not null,
 sizes text[] not null default '{}', images text[] not null default '{}',
 stock_quantity integer not null default 0 check(stock_quantity>=0), is_active boolean not null default true,
 featured boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.product_images (
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products on delete cascade,
 storage_path text not null, alt_text text, sort_order integer not null default 0, created_at timestamptz not null default now()
);
create table public.carts (
 id uuid primary key default gen_random_uuid(), user_id uuid not null unique references auth.users on delete cascade,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.cart_items (
 id uuid primary key default gen_random_uuid(), cart_id uuid not null references public.carts on delete cascade,
 product_id uuid not null references public.products on delete cascade, size text not null, quantity integer not null check(quantity>0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(cart_id,product_id,size)
);
create table public.orders (
 id uuid primary key default gen_random_uuid(), user_id uuid references auth.users on delete set null,
 customer_name text not null, customer_email text not null, customer_phone text not null, delivery_address text not null,
 total_amount integer not null check(total_amount>=0), payment_status public.payment_state not null default 'pending',
 order_status public.order_state not null default 'pending', paystack_reference text unique,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.order_items (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders on delete cascade,
 product_id uuid references public.products on delete set null, size text not null, quantity integer not null check(quantity>0),
 unit_price integer not null check(unit_price>=0), created_at timestamptz not null default now()
);
create table public.payments (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders on delete cascade,
 user_id uuid references auth.users on delete set null, amount integer not null check(amount>=0),
 status public.payment_state not null default 'pending', paystack_reference text not null unique,
 verified_at timestamptz, created_at timestamptz not null default now()
);
create table public.site_content (
 key text primary key, value jsonb not null default '{}', updated_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin') $$;
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public
as $$ begin insert into public.profiles(id,full_name) values(new.id,new.raw_user_meta_data->>'full_name'); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Atomic, idempotent stock deduction. Called only after server-side Paystack verification.
create or replace function public.finalize_paid_order(p_order_id uuid,p_reference text,p_amount integer)
returns void language plpgsql security definer set search_path=public as $$
declare line record;
begin
 if not exists(select 1 from orders where id=p_order_id and paystack_reference=p_reference and total_amount=p_amount) then raise exception 'Order mismatch'; end if;
 if exists(select 1 from orders where id=p_order_id and payment_status='paid') then return; end if;
 for line in select * from order_items where order_id=p_order_id for update loop
   update products set stock_quantity=stock_quantity-line.quantity,updated_at=now()
   where id=line.product_id and stock_quantity>=line.quantity;
   if not found then raise exception 'Insufficient stock'; end if;
 end loop;
 update orders set payment_status='paid',order_status='processing',updated_at=now() where id=p_order_id;
 update payments set status='paid',verified_at=now() where order_id=p_order_id and paystack_reference=p_reference;
end $$;
revoke all on function public.finalize_paid_order(uuid,text,integer) from public, anon, authenticated;
grant execute on function public.finalize_paid_order(uuid,text,integer) to service_role;

alter table profiles enable row level security; alter table products enable row level security;
alter table product_images enable row level security; alter table carts enable row level security;
alter table cart_items enable row level security; alter table orders enable row level security;
alter table order_items enable row level security; alter table payments enable row level security;
alter table site_content enable row level security;
create policy "profile self read" on profiles for select using(id=auth.uid() or is_admin());
create policy "profile self update" on profiles for update using(id=auth.uid()) with check(id=auth.uid() and role=(select role from profiles where id=auth.uid()));
create policy "public active products" on products for select using(is_active or is_admin());
create policy "admins manage products" on products for all using(is_admin()) with check(is_admin());
create policy "public product images" on product_images for select using(exists(select 1 from products p where p.id=product_id and p.is_active));
create policy "admins manage images" on product_images for all using(is_admin()) with check(is_admin());
create policy "owners manage carts" on carts for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "owners manage cart items" on cart_items for all using(exists(select 1 from carts c where c.id=cart_id and c.user_id=auth.uid())) with check(exists(select 1 from carts c where c.id=cart_id and c.user_id=auth.uid()));
create policy "owners read orders" on orders for select using(user_id=auth.uid() or is_admin());
create policy "admins update orders" on orders for update using(is_admin()) with check(is_admin());
create policy "owners read order items" on order_items for select using(exists(select 1 from orders o where o.id=order_id and (o.user_id=auth.uid() or is_admin())));
create policy "owners read payments" on payments for select using(user_id=auth.uid() or is_admin());
create policy "public content read" on site_content for select using(true);
create policy "admins manage content" on site_content for all using(is_admin()) with check(is_admin());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
create policy "public product image access" on storage.objects for select using(bucket_id='product-images');
create policy "admins upload product images" on storage.objects for insert with check(bucket_id='product-images' and public.is_admin());
create policy "admins update product images" on storage.objects for update using(bucket_id='product-images' and public.is_admin());
create policy "admins delete product images" on storage.objects for delete using(bucket_id='product-images' and public.is_admin());

insert into products(name,slug,description,price,category,sizes,stock_quantity,featured) values
('FITS Core Jersey','fits-core-jersey','A relaxed performance jersey cut for movement and everyday wear.',38000,'Jerseys',array['S','M','L','XL'],18,true),
('Monochrome Track Set','monochrome-track-set','Structured two-piece track set with a clean monochrome finish.',65000,'Sets',array['M','L','XL'],9,true),
('F4L Heavyweight Tee','f4l-heavyweight-tee','Premium heavyweight cotton with an oversized silhouette.',28000,'T-Shirts',array['S','M','L','XL','XXL'],24,true);

