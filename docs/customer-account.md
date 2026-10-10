# Customer account and orders

`/account` shows authenticated customers their newest orders with paginated history. The account icon, ordinary login and confirmation callbacks now lead here. Storefront proxy routing permits `/account` on both the primary and shop domain.

`/account/orders/[id]` shows order item snapshots, payment status, totals, delivery information and admin-updated delivery progress. Refresh status fetches current server data. This is not live courier tracking; no tracking provider or invented tracking number is used.

`/account/orders/[id]/receipt` is available only for paid orders. Print / save as PDF uses the browser print dialog with receipt-only print styling. Pending, failed and refunded orders do not receive a paid receipt.

All requests validate the Supabase session on the server. Queries use the session client (not a service role) and explicitly filter `user_id` by the authenticated user's ID, including for admins accessing this customer dashboard. Order IDs alone never grant access. Existing owner-only RLS policies remain in force. No public order API or database migration is introduced. Account pages are private, dynamically rendered and marked noindex.

Orders placed while signed in are already linked during payment initialization. Previous guest orders are not claimed by email automatically. A future guest-order claim flow must verify ownership before attaching records. The checkout copy makes this limitation explicit.

Checks: `node --test tests/customer-orders.test.cjs tests/launch-pricing.test.cjs`, targeted lint and production build. Tests cover signed-out redirects, owner-scoped queries, foreign/malformed IDs, database errors, delivery states and paid-only receipts without querying live customer data. Local production HTTP smoke tests confirmed login redirects for the account, detail and receipt routes; Next's loading boundary emits these as streamed redirects rather than an initial HTTP 307.
