-- Admin email allowlist for FITS manager access.
-- Admins are still enforced through public.profiles.role; this table makes it easy
-- to mark specific Supabase Auth emails as admin during signup.

create table if not exists public.admin_allowlist (
  email text primary key check (position('@' in email) > 1),
  note text,
  created_at timestamptz not null default now()
);

alter table public.admin_allowlist enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'admin_allowlist'
      and policyname = 'admins read admin allowlist'
  ) then
    create policy "admins read admin allowlist" on public.admin_allowlist
      for select using (public.is_admin());
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'admin_allowlist'
      and policyname = 'admins manage admin allowlist'
  ) then
    create policy "admins manage admin allowlist" on public.admin_allowlist
      for all using (public.is_admin()) with check (public.is_admin());
  end if;
end;
$$;

create or replace function public.is_admin_email(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_allowlist
    where lower(email) = lower(p_email)
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    case when public.is_admin_email(new.email) then 'admin'::public.user_role else 'customer'::public.user_role end
  )
  on conflict (id) do update
  set role = case
    when public.is_admin_email(new.email) then 'admin'::public.user_role
    else public.profiles.role
  end;
  return new;
end;
$$;
