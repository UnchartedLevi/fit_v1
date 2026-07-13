# FITS

Premium sportswear storefront built with Next.js 16, TypeScript, Tailwind CSS, Supabase and Paystack.

## Run locally

```bash
cd D:\fits
copy .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`. The catalogue UI works with demo products before services are configured.

## Environment

Fill `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxx
PAYSTACK_SECRET_KEY=sk_test_xxx
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret
APP_URL=http://localhost:3000
INSTAGRAM_USER_ID=your_instagram_business_or_creator_user_id
INSTAGRAM_ACCESS_TOKEN=your_instagram_graph_api_access_token
INSTAGRAM_GRAPH_API_VERSION=v23.0
```

Only variables prefixed `NEXT_PUBLIC_` reach the browser. Never prefix the Paystack secret or Supabase service-role key.

## Spotlight Instagram feed

The homepage Spotlight section and `/spotlight` page can automatically pull the latest FITS Instagram posts. Configure these server-side variables in `.env.local`:

```env
INSTAGRAM_USER_ID=your_instagram_business_or_creator_user_id
INSTAGRAM_ACCESS_TOKEN=your_instagram_graph_api_access_token
INSTAGRAM_GRAPH_API_VERSION=v23.0
```

The app requests each post's caption, media URL, thumbnail, permalink, media type and timestamp from the Instagram Graph API. Posts are cached for one hour with Next.js revalidation, then styled into the FITS newspaper/Instagram card layout. If the variables are missing or the API request fails, the site uses local fallback spotlight posts so the page still renders.

## Supabase setup

1. Create a Supabase project.
2. Open SQL Editor and run the files in `supabase/migrations/` in filename order. `supabase/schema.sql` is legacy and will be removed after the migration flow is fully adopted.
3. In Authentication â†’ URL Configuration, set the site URL to `http://localhost:3000` during development and add the production URL later.
4. Add the URL and anon key to `.env.local`.
5. Product images use the public `product-images` Storage bucket created by the migration. Uploads are restricted to admins.

The migration creates products, image metadata, profiles, carts, cart items, orders, order items, payments, editable site content, RLS policies, and an atomic paid-order finalizer.

## First admin

1. Sign up through `/auth/signup` and confirm the email.
2. In Supabase SQL Editor, use the account email:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'manager@example.com');
```

3. Sign out/in, then visit `/admin`. Never expose an admin promotion action publicly.

## Paystack

Get test keys from Paystack Dashboard â†’ Settings â†’ API Keys & Webhooks, put them in `.env.local`, and restart Next.js. Checkout creates a pending order from server-fetched prices, initializes Paystack server-side, then verifies status, amount and currency server-side before the database function atomically marks it paid and deducts stock.

For production, set the Paystack callback URL to `${APP_URL}/checkout/callback` and the webhook URL to `${APP_URL}/api/paystack/webhook` after the webhook route is added.

## Manual production checklist

- Replace demo placeholders by uploading licensed WebP/JPEG images to Supabase Storage and recording their public URLs.
- Add production Supabase and Paystack keys to the hosting provider (Vercel recommended).
- Set production Auth redirect URLs, domain, shipping rules, privacy/returns pages, and transactional email.
- Complete the inline admin product editor if the manager should avoid Supabase Studio; all database authorization is already in place.
- Test Paystack in test mode, then swap to live keys only after the live domain is configured.
