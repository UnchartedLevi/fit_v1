import { AdminShippingEditor } from "@/components/admin-shipping-editor";

export const metadata = {
  title: "Shipping Methods — FITS Admin",
  description: "Manage store delivery zones, rates, and estimated times of arrival.",
};

export default function AdminShippingPage() {
  return <AdminShippingEditor />;
}
