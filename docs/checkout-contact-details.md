# Checkout contact details

Checkout accepts a name or Instagram username rather than requiring a formal name.

The payment phone and contact (Telegram) phone both use a fixed +234 prefix and exactly ten national mobile digits. Input strips non-digits and handles pasted local/international formats. Server validation rejects malformed or overlong numbers without truncating them.

The contact phone mirrors edits to the payment phone until the customer edits the contact field, including clearing it. That choice is saved with checkout details and respected after reloading. Existing saved single-number checkout details initialize both fields from the saved phone.

The API keeps `customer.phone` as the payment phone and accepts `customer.contact_phone` separately. Old clients that omit the contact phone fall back to their payment phone. Orders store the contact number in `customer_phone` and `delivery_address_snapshot.phone` so admin delivery workflows and order emails use the correct number. The payment number is retained in `delivery_address_snapshot.payment_phone`; Paystack metadata includes both numbers. No database migration is needed.

Payment verification codes are controlled by the bank/payment provider; entering a number here does not change the bank's registered OTP destination. The form explains this rather than promising checkout can route an OTP.

Delivery instructions ask only for Covenant University hall and room number.

Verification: phone/autofill and mocked payment-route regression tests in `tests/launch-pricing.test.cjs`, targeted ESLint, and production build. Tests do not create live orders or make live payments.
