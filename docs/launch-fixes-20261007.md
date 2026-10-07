# Launch fixes October 7 2026

The primary domain and shop subdomain continue to use the documented storefront mode.

Footer links now display Instagram, X/Twitter and Telegram with @fits4l. The footer address and telephone links have been removed.

The only public and admin-selectable categories are Football, Basketball, Tennis, Jerseys, Gym & Fitness, Accessories and Lifestyle. The live Supabase categories and product metadata were synchronized using `scripts/sync-launch-categories.mjs`. Retired category records remain inactive to preserve historical references and product data.

Admins can create a Free Shipping coupon with an optional minimum spend. These coupons waive the selected delivery method's fee, including for products excluded from item discounts. Checkout recalculates shipping and coupon amounts on the server using stored records. The browser cannot dictate the payment amount.

Free Shipping coupons can persist through the existing site_content coupon store immediately. The migration `supabase/migrations/202610070001_launch_categories_and_free_shipping.sql` additionally enables the new type in the dedicated coupon_codes table. Apply it with a database migration connection when available; no SQL execution connection was available during this update.

Admin navigation and editors now adapt to phones and tablets. Checkout shipping choices use the page background, green selected borders and green radio buttons. Product discount labels use variant prices rather than a potentially unset base price.

Live Paystack credentials from the owner's test document were installed only in the ignored local `.env.local`. The secret was validated through a read-only Paystack API request; no payment was made. Never copy credentials into this repository.

Production payment setup requires the Vercel production environment to contain the live `PAYSTACK_SECRET_KEY`, followed by a deployment. The public key configuration is now named `PAYSTACK_PUBLIC_KEY` and can be stored without a public framework prefix. Hosted checkout initializes on the server using the secret key; it does not currently consume the public key. Vercel account access was not available during this update. The Word document contains a live secret; rotate that key before distributing the document further.

Verification: `node --test tests/launch-pricing.test.cjs`, targeted ESLint, production build, and browser checks for category tabs, footer, coupon form and responsive admin layout.
