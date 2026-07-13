# FITS E-Commerce MVP Audit

Date: 2026-07-13

## Current stack

- Framework: Next.js 16.2.9
- Router: App Router under `src/app`
- Language: TypeScript, strict mode enabled
- Styling: global CSS plus Tailwind CSS v4 PostCSS import
- UI state: React context for cart, local component state for filters/forms
- Backend SDKs: `@supabase/ssr`, `@supabase/supabase-js`
- Payments: Paystack API routes exist for initialize and verify
- Validation: Zod is installed and used in Paystack initialize route
- Tests: no test script or test runner currently configured

## Current routes

Customer-facing:

- `/`
- `/products`
- `/products/[slug]`
- `/cart`
- `/checkout`
- `/checkout/callback`
- `/auth/login`
- `/auth/signup`
- `/spotlight`
- `/about`

Admin:

- `/admin`
- `/admin/products`
- `/admin/orders`

API:

- `/api/paystack/initialize`
- `/api/paystack/verify`

## Existing data model and backend state

The project has a single SQL file at `supabase/schema.sql`.

Existing tables:

- `profiles`
- `products`
- `product_images`
- `carts`
- `cart_items`
- `orders`
- `order_items`
- `payments`
- `site_content`

Existing backend features:

- Supabase browser/server/admin clients
- Supabase auth login/signup form
- Auth session refresh proxy
- Admin role guard using `profiles.role`
- RLS policies in `supabase/schema.sql`
- Product image storage bucket policy
- Paystack initialize route
- Paystack verify route
- Atomic `finalize_paid_order` RPC for payment finalization and stock deduction

## Gaps against the MVP brief

Schema gaps:

- No reproducible timestamped migrations directory yet.
- No `categories` table.
- No `product_variants` table.
- No `addresses` table.
- No guest cart support in database.
- Cart requires `user_id`; it cannot store guest carts.
- Orders lack full status/payment/fulfilment enums requested in the brief.
- Orders do not store delivery snapshots as structured JSON.
- Order items do not store complete immutable product snapshots.
- Payments table is minimal and lacks channel, gateway response, verified metadata and webhook idempotency fields.
- No delivery fee configuration table or central delivery model.
- Seed data contains only 3 database products.

Frontend gaps:

- Product listing and detail pages still use `demoProducts`.
- Search/filter/sort state is client-only and not URL-driven except initial category.
- Product variants are represented only as `sizes` on the product.
- Cart is localStorage-only and not synced to Supabase.
- Cart does not merge guest/authenticated carts.
- Cart currently loses items after full navigation due localStorage hydration/write ordering.
- Checkout submits browser cart items to the server; server revalidates products but does not use a database-backed cart.
- Checkout allows guest payment; brief prefers login before final payment.
- No saved delivery address management.
- No customer account dashboard, order history, or order detail page.
- Admin is mostly read-only; no create/edit product, variants, categories, inventory update, or order fulfilment update UI.
- No password reset flow.
- Header account link is not auth-aware.

Payment/security gaps:

- No Paystack webhook route.
- Callback verification exists, but payment finalization is not shared with webhook logic.
- Payment initialization uses request origin rather than `APP_URL`.
- No webhook signature validation yet.
- No explicit idempotency records beyond payment/order status.
- No rate limiting.
- No security headers/CSP.
- No structured safe logging/correlation IDs.

Testing gaps:

- No unit test framework configured.
- No integration tests.
- No end-to-end tests.
- RLS has not been tested with separate users in this environment.

## Automated validation results

- `npm run lint`: passed.
- `npm run build`: passed after rerun with elevated access because the Windows sandbox initially blocked writing `.next/trace`.
- No package test script exists.

## Browser audit notes

Audited routes in the in-app browser against `http://127.0.0.1:3000`:

- `/`
- `/products`
- `/products/fits-core-jersey`
- `/cart`
- `/checkout`
- `/auth/login`
- `/auth/signup`
- `/spotlight`
- `/about`

Findings:

- Main routes render without browser console errors.
- No horizontal overflow detected on audited desktop viewport.
- Add-to-cart increments the header badge immediately.
- Initial audit found that navigation to `/cart` reset the cart because `CartProvider` wrote `[]` before storage hydration finished. This was fixed during Phase 2/5 foundation work and verified in-browser: `/cart` preserved one cart row after navigation.
- Checkout page renders with empty cart and disabled payment button.

## Existing environment files

- `.env.example` exists.
- `.env*` is ignored by Git.
- No local `.env.local` was present during audit.

Required environment expansion:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_WEBHOOK_SECRET`
- `APP_URL`
- optional Instagram variables already present

## Implementation direction

Preserve the existing Next.js App Router, CSS system, Supabase SDK usage, Paystack route pattern, and FITS visual design.

The safest path is to replace the simplified schema with timestamped migrations, add typed service modules, then progressively move the existing demo-driven UI to Supabase-backed server/client flows without redesigning the interface.

