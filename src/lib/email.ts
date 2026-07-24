type OrderItemRecord = {
  quantity: number;
  unit_price: number;
  variant_description: string | null;
  product_name: string;
  line_total: number;
};

type OrderWithItems = {
  id: string;
  order_number: string;
  customer_name?: string;
  customer_email: string;
  customer_phone: string;
  delivery_address_snapshot: Record<string, unknown>;
  total_amount: number;
  paystack_reference: string;
  created_at: string;
  order_items?: OrderItemRecord[];
};

function getCustomerName(order: OrderWithItems) {
  return String(order.delivery_address_snapshot.recipient_name ?? order.customer_name ?? "FITS customer");
}

function getDeliveryAddress(order: OrderWithItems) {
  return String(order.delivery_address_snapshot.address_line_1 ?? "Covenant University, Ota, Ogun");
}

export async function sendOrderNotificationEmails(order: OrderWithItems) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  const vendorEmail = process.env.ORDER_NOTIFICATION_EMAIL;

  if (!apiKey || !fromEmail || !vendorEmail) return;

  const customerName = getCustomerName(order);
  const deliveryAddress = getDeliveryAddress(order);
  const subject = `FITS order confirmed: ${order.order_number}`;
  const itemsHtml = (order.order_items ?? [])
    .map(
      (item) =>
        `<tr><td>${item.quantity}</td><td>${item.product_name}</td><td>${item.variant_description ?? "Default"}</td><td>${item.unit_price.toLocaleString("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 })}</td><td>${item.line_total.toLocaleString("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 })}</td></tr>`,
    )
    .join("");

  const html = `
    <div style="font-family: sans-serif; line-height: 1.5; color: #111;">
      <h2>FITS Order Confirmed</h2>
      <p>Order <strong>${order.order_number}</strong> has been verified and marked paid.</p>
      <p><strong>Customer:</strong> ${customerName} &ndash; ${order.customer_email} &ndash; ${order.customer_phone}</p>
      <p><strong>Delivery address:</strong> ${deliveryAddress}</p>
      <table style="border-collapse: collapse; width: 100%; margin-top: 16px;">
        <thead>
          <tr>
            <th style="border-bottom: 1px solid #ddd; text-align: left; padding: 8px;">Qty</th>
            <th style="border-bottom: 1px solid #ddd; text-align: left; padding: 8px;">Product</th>
            <th style="border-bottom: 1px solid #ddd; text-align: left; padding: 8px;">Variant</th>
            <th style="border-bottom: 1px solid #ddd; text-align: left; padding: 8px;">Price</th>
            <th style="border-bottom: 1px solid #ddd; text-align: left; padding: 8px;">Line total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <p style="margin-top: 16px;"><strong>Total:</strong> ${order.total_amount.toLocaleString("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 })}</p>
      <p>Reference: ${order.paystack_reference}</p>
    </div>
  `;

  const textItems = (order.order_items ?? [])
    .map(
      (item) =>
        `${item.quantity} × ${item.product_name} (${item.variant_description ?? "Default"}) @ ${item.unit_price.toLocaleString("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 })} = ${item.line_total.toLocaleString("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 })}`,
    )
    .join("\n");

  const text = `FITS Order Confirmed\n\nOrder: ${order.order_number}\nCustomer: ${customerName} <${order.customer_email}>\nPhone: ${order.customer_phone}\nDelivery address: ${deliveryAddress}\n\nItems:\n${textItems}\n\nTotal: ${order.total_amount.toLocaleString("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 })}\nReference: ${order.paystack_reference}`;

  const payload = {
    personalizations: [
      { to: [{ email: order.customer_email }] },
      { to: [{ email: vendorEmail }] },
    ],
    from: { email: fromEmail, name: "FITS Store" },
    subject,
    content: [
      { type: "text/plain", value: text },
      { type: "text/html", value: html },
    ],
  };

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("SendGrid email failed:", response.status, body);
  }
}
