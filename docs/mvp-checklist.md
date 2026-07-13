# FITS E-Commerce MVP Checklist

Status legend:

- `[ ]` not started
- `[~]` in progress
- `[x]` complete
- `[!]` blocked/manual action required

## Phase 1: Audit and foundation

- [x] Inspect repository structure.
- [x] Read project documentation.
- [x] Identify framework, routing, styling and state approach.
- [x] Identify existing product, auth, cart, checkout, Supabase and Paystack code.
- [x] Run lint.
- [x] Run build.
- [x] Start local dev server.
- [x] Browser-audit main customer pages.
- [x] Document architecture and gaps.
- [x] Create tracked MVP checklist.

## Phase 2: Supabase foundation

- [ ] Create or connect Supabase project `fits-commerce`.
- [ ] Add local `.env.local` values without committing secrets.
- [x] Expand `.env.example` placeholders.
- [x] Convert `supabase/schema.sql` into timestamped reproducible migrations.
- [x] Add full relational schema: profiles, categories, products, images, variants, addresses, carts, cart items, orders, order items, payments and delivery config.
- [x] Add RLS policies for customer/admin/public access.
- [x] Add storage bucket and policies for product images.
- [x] Add atomic inventory/payment finalization functions.
- [x] Add repeatable seed data for at least 12 products.
- [ ] Generate or define database TypeScript types.

## Phase 3: Authentication and account

- [ ] Signup with profile creation.
- [ ] Login.
- [ ] Logout.
- [ ] Session-aware navigation.
- [ ] Forgot password.
- [ ] Reset password.
- [ ] Protected account routes.
- [ ] Profile page.
- [ ] Address list/create/edit/delete/default.
- [ ] Guest cart merge after login.

## Phase 4: Catalogue

- [~] Load product listings from Supabase.
- [~] Load product details from Supabase.
- [ ] Support categories.
- [ ] Support variants: size, colour, option values.
- [ ] Product image gallery.
- [ ] Featured products.
- [ ] Related products.
- [ ] Stock state display.
- [ ] Search with URL state.
- [ ] Filters with URL state.
- [ ] Sorting with URL state.
- [ ] Server-side pagination/querying.

## Phase 5: Cart

- [x] Fix current localStorage hydration bug.
- [ ] Add durable guest cart identifier.
- [ ] Store guest carts in Supabase.
- [ ] Store authenticated carts in Supabase.
- [ ] Add item.
- [ ] Remove item.
- [ ] Update quantities.
- [ ] Clear cart.
- [ ] Prevent quantities above stock.
- [ ] Server revalidate cart prices and inventory.
- [ ] Merge guest/auth carts without duplicates.

## Phase 6: Checkout and Paystack

- [ ] Require login before final payment.
- [ ] Select or create delivery address.
- [ ] Central delivery fee calculation.
- [ ] Server-side subtotal/total calculation.
- [ ] Create pending order from database cart.
- [ ] Create immutable order item snapshots.
- [ ] Initialize Paystack server-side.
- [ ] Use `APP_URL` for callback URL.
- [ ] Verify Paystack callback server-side.
- [ ] Add Paystack webhook route.
- [ ] Validate webhook signature.
- [ ] Share idempotent payment finalization service.
- [ ] Deduct inventory atomically after verified payment.
- [ ] Mark cart converted after payment.
- [ ] Handle failed/cancelled payments safely.

## Phase 7: Customer orders

- [ ] Order confirmation page.
- [ ] Account order history.
- [ ] Account order detail page.
- [ ] Status timeline.
- [ ] Customer-only order access enforcement.

## Phase 8: Admin

- [ ] Dashboard metrics from database.
- [ ] Product list from database.
- [ ] Create product.
- [ ] Edit product.
- [ ] Product images.
- [ ] Product variants.
- [ ] Inventory management.
- [ ] Category management.
- [ ] Order list.
- [ ] Order detail.
- [ ] Update fulfilment status.
- [ ] Server-verified admin actions.

## Phase 9: Hardening, tests and docs

- [ ] Unit test cart/order/payment/inventory business logic.
- [ ] Integration test auth/cart/checkout/payment/admin restrictions.
- [ ] Browser E2E happy path.
- [ ] Browser E2E failed payment.
- [ ] Browser E2E duplicate callback/webhook.
- [ ] Mobile responsive verification.
- [ ] RLS verification with two users.
- [ ] Security headers/CSP.
- [ ] Safe structured logging.
- [ ] Deployment docs.
- [ ] Paystack callback/webhook setup docs.
- [ ] Supabase redirect URL setup docs.



