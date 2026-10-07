import { createAdminClient } from "@/lib/supabase/admin";
import type { CouponCode, StoreProduct } from "@/lib/commerce-types";

export const defaultCoupons: CouponCode[] = [
  {
    id: "coupon-fits10",
    code: "FITS10",
    type: "percentage",
    value: 10,
    min_spend: 0,
    is_active: true,
    times_used: 0,
  },
  {
    id: "coupon-welcome2000",
    code: "WELCOME2000",
    type: "fixed",
    value: 2000,
    min_spend: 10000,
    is_active: true,
    times_used: 0,
  },
];

export async function getAllCouponsAdmin(): Promise<CouponCode[]> {
  try {
    const admin = createAdminClient();
    if (!admin) return defaultCoupons;

    const { data: tableData, error: tableError } = await admin
      .from("coupon_codes")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: contentData } = await admin
      .from("site_content")
      .select("value")
      .eq("key", "coupon_codes")
      .maybeSingle();

    if (contentData?.value && Array.isArray(contentData.value)) {
      const combined = new Map((tableData ?? []).map((c: CouponCode) => [c.code.toUpperCase(), c]));
      for (const coupon of contentData.value as CouponCode[]) combined.set(coupon.code.toUpperCase(), coupon);
      return [...combined.values()];
    }
    if (!tableError && tableData) return tableData as CouponCode[];
  } catch (err) {
    console.error("Failed to get admin coupons:", err);
  }

  return defaultCoupons;
}

export async function findCouponByCode(code: string): Promise<CouponCode | null> {
  const normalized = code.trim().toUpperCase();
  const coupons = await getAllCouponsAdmin();
  return coupons.find((c) => c.code.toUpperCase() === normalized) ?? null;
}

export type CouponValidationResult = {
  valid: boolean;
  code?: string;
  type?: CouponCode["type"];
  value?: number;
  discount: number;
  eligibleAmount: number;
  message?: string;
  freeShipping?: boolean;
  error?: string;
};

export async function validateCoupon(
  code: string,
  items: { product: StoreProduct; quantity: number; unitPrice: number }[],
  orderSubtotal: number
): Promise<CouponValidationResult> {
  if (!code || !code.trim()) {
    return { valid: false, discount: 0, eligibleAmount: 0, error: "Please enter a coupon code." };
  }

  const coupon = await findCouponByCode(code);
  if (!coupon) {
    return { valid: false, discount: 0, eligibleAmount: 0, error: "Invalid coupon code." };
  }

  if (!coupon.is_active) {
    return { valid: false, discount: 0, eligibleAmount: 0, error: "This coupon is no longer active." };
  }

  if (coupon.min_spend && orderSubtotal < coupon.min_spend) {
    return {
      valid: false,
      discount: 0,
      eligibleAmount: 0,
      error: `Minimum order amount of ₦${coupon.min_spend.toLocaleString()} required for this coupon.`,
    };
  }

  if (coupon.type === "free_shipping") {
    return { valid: true, code: coupon.code, type: coupon.type, value: 0,
      discount: 0, eligibleAmount: orderSubtotal, freeShipping: true,
      message: "Free shipping applied!" };
  }

  // Calculate eligible amount based on product SBU flag.
  // SBU flag: Indicates whether discount code can be applied to a product or not.
  // If product.is_sbu is false, coupon cannot apply to that product.
  // If undefined, default to true unless explicitly marked false.
  let eligibleAmount = 0;
  for (const item of items) {
    const isDiscountEligible = item.product.is_sbu !== false;
    if (isDiscountEligible) {
      eligibleAmount += item.unitPrice * item.quantity;
    }
  }

  if (eligibleAmount <= 0) {
    return {
      valid: false,
      discount: 0,
      eligibleAmount: 0,
      error: "None of the products in your bag are eligible for coupon discounts.",
    };
  }

  let discount = 0;
  if (coupon.type === "percentage") {
    discount = Math.round((eligibleAmount * coupon.value) / 100);
  } else {
    discount = Math.min(coupon.value, eligibleAmount);
  }

  return {
    valid: true,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discount,
    eligibleAmount,
    message: coupon.type === "percentage" ? `${coupon.value}% discount applied!` : `₦${coupon.value.toLocaleString()} discount applied!`,
  };
}

export async function saveCoupon(coupon: Partial<CouponCode> & { code: string; type: CouponCode["type"]; value: number }): Promise<CouponCode> {
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase admin client not available");

  if (!coupon.code.trim() || !["percentage", "fixed", "free_shipping"].includes(coupon.type)) throw new Error("Invalid coupon code or discount type.");
  if (coupon.type !== "free_shipping" && (!Number.isFinite(Number(coupon.value)) || Number(coupon.value) <= 0 || (coupon.type === "percentage" && Number(coupon.value) > 100))) throw new Error("Invalid discount value.");
  if (!Number.isFinite(Number(coupon.min_spend || 0)) || Number(coupon.min_spend || 0) < 0) throw new Error("Invalid minimum spend.");
  const id = coupon.id || crypto.randomUUID();
  const record: CouponCode = {
    id,
    code: coupon.code.trim().toUpperCase(),
    type: coupon.type,
    value: coupon.type === "free_shipping" ? 0 : Number(coupon.value),
    min_spend: Number(coupon.min_spend || 0),
    is_active: coupon.is_active !== undefined ? coupon.is_active : true,
    times_used: coupon.times_used || 0,
  };

  // Attempt save to coupon_codes table
  const { error: tableError } = await admin.from("coupon_codes").upsert(record);

  // Sync with site_content
  const { data: content } = await admin.from("site_content").select("value").eq("key", "coupon_codes").maybeSingle();
  let list = (content?.value as CouponCode[]) || await getAllCouponsAdmin();
  const index = list.findIndex((c) => c.id === id || c.code.toUpperCase() === record.code);
  if (index >= 0) {
    list[index] = record;
  } else {
    list = [record, ...list];
  }
  const { error: contentError } = await admin.from("site_content").upsert({ key: "coupon_codes", value: list });
  if (tableError && contentError) throw new Error("Could not save coupon code.");

  return record;
}

export async function deleteCoupon(id: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase admin client not available");

  await admin.from("coupon_codes").delete().eq("id", id);

  const { data: content } = await admin.from("site_content").select("value").eq("key", "coupon_codes").maybeSingle();
  if (content?.value && Array.isArray(content.value)) {
    const list = (content.value as CouponCode[]).filter((c) => c.id !== id);
    await admin.from("site_content").upsert({ key: "coupon_codes", value: list });
  }
}
