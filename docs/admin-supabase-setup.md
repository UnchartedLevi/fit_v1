# FITS admin and Supabase setup

## Admin portal

The admin portal is available at:

```text
/admin
```

There is also a `Manager` link in the main navigation. The route is protected on the server. Visitors who are not signed in are sent to:

```text
/auth/login?next=/admin
```

Signed-in users without the `admin` profile role are redirected back to the storefront.

## Making a user an admin

Preferred flow for new admins:

1. In Supabase Dashboard, open SQL Editor.
2. Add the admin email to the allowlist before the user signs up:

```sql
insert into public.admin_allowlist (email, note)
values ('admin@example.com', 'FITS manager')
on conflict (email) do update
set note = excluded.note;
```

3. The user signs up normally on the site with that same email.
4. Supabase automatically creates their `profiles` row with `role = 'admin'`.
5. The user signs in and opens `/admin`.

If the user already signed up before being allowlisted:

1. Sign up normally on the site with the email address that should manage FITS.
2. Confirm the email if Supabase email confirmation is enabled.
3. In Supabase Dashboard, open SQL Editor.
4. Run this SQL, replacing the email:

```sql
update public.profiles
set role = 'admin',
    updated_at = now()
where id = (
  select id
  from auth.users
  where email = 'admin@example.com'
);
```

5. Sign out and sign back in.
6. Open `/admin`.

Do not let users choose their own role in the frontend. Admin access is controlled by `public.profiles.role` and the database RLS policies.

## Supabase CLI commands

The project is configured for Supabase project:

```text
zuehevpyssvschhsjkru
```

When the CLI is available and authenticated:

```bash
supabase login
supabase link --project-ref zuehevpyssvschhsjkru
supabase db push
```

If this is a fresh project and seed data is required:

```bash
supabase db push
```

The migration files are under:

```text
supabase/migrations/
```

## Product image uploads

The admin product editor supports:

- Direct image URL entry
- Cloudinary unsigned uploads once these public values are configured:

```text
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```

Create an unsigned Cloudinary upload preset scoped for product images before enabling file uploads in production.
