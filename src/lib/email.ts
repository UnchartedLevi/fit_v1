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

function getDeliverySnapshotValue(order: OrderWithItems, key: string, fallback = "") {
  const value = order.delivery_address_snapshot[key];
  return value == null || value === "" ? fallback : String(value);
}

function getAdminRecipients(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

function escapeHtml(value: unknown) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendOrderNotificationEmails(order: OrderWithItems) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const adminEmails = getAdminRecipients(process.env.ORDER_NOTIFICATION_EMAIL);

  if (!apiKey || !fromEmail || adminEmails.length === 0) {
    console.warn("Order email skipped: RESEND_API_KEY, RESEND_FROM_EMAIL, or ORDER_NOTIFICATION_EMAIL is missing.");
    return;
  }

  const customerName = getCustomerName(order);
  const deliveryAddress = getDeliveryAddress(order);
  const city = getDeliverySnapshotValue(order, "city", "Ota");
  const state = getDeliverySnapshotValue(order, "state", "Ogun");
  const country = getDeliverySnapshotValue(order, "country", "Nigeria");
  const instructions = getDeliverySnapshotValue(order, "delivery_instructions", "None");
  const orderDate = new Date(order.created_at).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  });
  const formattedTotal = order.total_amount.toLocaleString("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
  const customerSubject = `FITS order confirmed: ${order.order_number}`;
  const adminSubject = `New paid FITS order: ${order.order_number} — ${customerName}`;
  const itemsHtml = (order.order_items ?? [])
    .map(
      (item) =>
        `<tr><td>${item.quantity}</td><td>${escapeHtml(item.product_name)}</td><td>${escapeHtml(item.variant_description ?? "Default")}</td><td>${item.unit_price.toLocaleString("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 })}</td><td>${item.line_total.toLocaleString("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 })}</td></tr>`,
    )
    .join("");

  const tableHtml = `
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
  `;

  const customerHtml = `
    <div style="font-family: sans-serif; line-height: 1.5; color: #111;">
      <h2>FITS Order Confirmed</h2>
      <p>Thanks ${escapeHtml(customerName)} — your order <strong>${escapeHtml(order.order_number)}</strong> has been verified and marked paid.</p>
      <p><strong>Delivery address:</strong> ${escapeHtml(deliveryAddress)}</p>
      ${tableHtml}
      <p style="margin-top: 16px;"><strong>Total:</strong> ${formattedTotal}</p>
      <p>Reference: ${escapeHtml(order.paystack_reference)}</p>
    </div>
  `;

  const adminHtml = `
    <div style="font-family: sans-serif; line-height: 1.5; color: #111;">
      <h2>New FITS Paid Order</h2>
      <p>Order <strong>${escapeHtml(order.order_number)}</strong> has been paid and needs fulfilment.</p>
      <h3>Customer/order form details</h3>
      <ul>
        <li><strong>Name:</strong> ${escapeHtml(customerName)}</li>
        <li><strong>Email:</strong> ${escapeHtml(order.customer_email)}</li>
        <li><strong>Phone:</strong> ${escapeHtml(order.customer_phone)}</li>
        <li><strong>Delivery address:</strong> ${escapeHtml(deliveryAddress)}</li>
        <li><strong>City/State/Country:</strong> ${escapeHtml(city)} / ${escapeHtml(state)} / ${escapeHtml(country)}</li>
        <li><strong>Delivery instructions:</strong> ${escapeHtml(instructions)}</li>
        <li><strong>Order date:</strong> ${escapeHtml(orderDate)}</li>
        <li><strong>Paystack reference:</strong> ${escapeHtml(order.paystack_reference)}</li>
      </ul>
      ${tableHtml}
      <p style="margin-top: 16px;"><strong>Total paid order amount:</strong> ${formattedTotal}</p>
    </div>
  `;

  const textItems = (order.order_items ?? [])
    .map(
      (item) =>
        `${item.quantity} × ${item.product_name} (${item.variant_description ?? "Default"}) @ ${item.unit_price.toLocaleString("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 })} = ${item.line_total.toLocaleString("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 })}`,
    )
    .join("\n");

  const customerText = `FITS Order Confirmed\n\nOrder: ${order.order_number}\nDelivery address: ${deliveryAddress}\n\nItems:\n${textItems}\n\nTotal: ${formattedTotal}\nReference: ${order.paystack_reference}`;

  const adminText = `New FITS Paid Order\n\nOrder: ${order.order_number}\nCustomer: ${customerName}\nEmail: ${order.customer_email}\nPhone: ${order.customer_phone}\nDelivery address: ${deliveryAddress}\nCity/State/Country: ${city} / ${state} / ${country}\nDelivery instructions: ${instructions}\nOrder date: ${orderDate}\nPaystack reference: ${order.paystack_reference}\n\nItems:\n${textItems}\n\nTotal: ${formattedTotal}`;

  const basePayload = {
    from: `FITS Store <${fromEmail}>`,
  };

  const emailPayloads = [
    {
      ...basePayload,
      to: [order.customer_email],
      subject: customerSubject,
      text: customerText,
      html: customerHtml,
    },
    {
      ...basePayload,
      to: adminEmails,
      subject: adminSubject,
      text: adminText,
      html: adminHtml,
      reply_to: order.customer_email,
    },
  ];

  for (const payload of emailPayloads) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("Resend email failed:", response.status, body);
    }
  }
}

export async function sendOrderStatusEmail(order: { order_number: string; customer_email: string; fulfilment_status: "shipped" | "delivered"; delivery_address_snapshot: Record<string, unknown> }) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !fromEmail) return;
  const delivered = order.fulfilment_status === "delivered";
  const recipient = String(order.delivery_address_snapshot.recipient_name ?? "FITS customer");
  const subject = delivered ? `Your FITS order ${order.order_number} has been delivered` : `Your FITS order ${order.order_number} is on the way`;
  const message = delivered ? "Your order has been marked as delivered. Thank you for shopping with FITS." : "Your order has been shipped and is now on the way to your delivery address.";
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: `FITS Store <${fromEmail}>`, to: [order.customer_email], subject, text: `Hi ${recipient},\n\n${message}\n\nOrder: ${order.order_number}`, html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:32px"><p style="font-size:12px;letter-spacing:.15em">FITS ORDER UPDATE</p><h1>${delivered ? "DELIVERED." : "ON THE WAY."}</h1><p>Hi ${escapeHtml(recipient)},</p><p>${message}</p><p><strong>Order:</strong> ${escapeHtml(order.order_number)}</p></div>` }) });
  if (!response.ok) console.error("Resend fulfilment email failed:", response.status, await response.text());
}
