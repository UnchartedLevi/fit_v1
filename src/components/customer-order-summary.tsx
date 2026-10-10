import { money } from "@/lib/products";
import { orderDate, type CustomerOrder } from "@/lib/customer-orders";

export function CustomerOrderSummary({ order }: { order: CustomerOrder }) {
  return <section className="account-panel receipt-content">
    <p className="eyebrow">FITS · {order.payment_status === "paid" ? "PAYMENT RECEIPT" : "ORDER SUMMARY"}</p>
    <h2>{order.order_number}</h2>
    <p>Ordered {orderDate(order.created_at)}{order.paid_at ? ` · Paid ${orderDate(order.paid_at)}` : ""}</p>
    <div className="account-order-items">{order.order_items.map((item) => <div className="account-item" key={item.id}>
      <div><strong>{item.product_name}</strong>{item.variant_description ? <small>{item.variant_description}</small> : null}<small>{item.quantity} × {money(item.unit_price)}</small></div>
      <strong>{money(item.line_total)}</strong>
    </div>)}</div>
    <dl className="account-totals">
      <div><dt>Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
      <div><dt>Discount</dt><dd>−{money(order.discount_amount)}</dd></div>
      <div><dt>Delivery</dt><dd>{money(order.delivery_fee)}</dd></div>
      {order.tax_amount > 0 ? <div><dt>Tax</dt><dd>{money(order.tax_amount)}</dd></div> : null}
      <div className="account-total"><dt>Total</dt><dd>{money(order.total_amount)}</dd></div>
    </dl>
    <div className="account-delivery"><h3>Customer & delivery</h3><p>{order.delivery_address_snapshot?.recipient_name}</p><p>{order.customer_email} · {order.customer_phone}</p><p>{order.delivery_address_snapshot?.address_line_1}</p><p>{order.delivery_address_snapshot?.shipping_zone}</p>
      {order.delivery_address_snapshot?.shipping_eta ? <p>Estimated delivery: {order.delivery_address_snapshot.shipping_eta}</p> : null}
      {order.payment_status === "paid" && order.paystack_reference ? <p className="account-reference">Payment reference: {order.paystack_reference}</p> : null}
    </div>
  </section>;
}
