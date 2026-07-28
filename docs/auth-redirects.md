# FITS authentication redirect URLs

Supabase Auth emails use `NEXT_PUBLIC_APP_URL` as their redirect base. The value is safe to expose to the browser and must not contain a secret.

## Vercel phase

Set the following in Vercel and the local `.env.local` file when testing Vercel email confirmation from a local browser:

```env
NEXT_PUBLIC_APP_URL=https://fit-v1.vercel.app
APP_URL=https://fit-v1.vercel.app
```

In Supabase **Authentication → URL Configuration**, set the Site URL to the Vercel URL and add both URLs to the redirect allow list:

```text
http://localhost:3000/auth/callback
https://fit-v1.vercel.app/auth/callback
```

## Custom-domain phase

After the Namecheap domain is connected and HTTPS is active, change both Vercel variables to the canonical production URL and update Supabase in the same release:

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
APP_URL=https://your-domain.com
```

Then set the Supabase Site URL to `https://your-domain.com` and add:

```text
https://your-domain.com/auth/callback
https://www.your-domain.com/auth/callback
```

Keep the localhost callback in the allow list for development. Do not include credentials or secret keys in either URL variable.
