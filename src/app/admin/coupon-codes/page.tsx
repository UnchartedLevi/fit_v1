import { AdminCouponsEditor } from "@/components/admin-coupons-editor";

export const metadata = {
  title: "Coupon Codes — FITS Admin",
  description: "Manage promotional discount codes and cashback rules.",
};

export default function AdminCouponsPage() {
  return <AdminCouponsEditor />;
}
