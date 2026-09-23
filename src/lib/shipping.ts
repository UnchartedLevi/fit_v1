import { createClient } from "@/lib/supabase/client";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ShippingMethod } from "@/lib/commerce-types";

export const defaultShippingMethods: ShippingMethod[] = [
  {
    id: "zone-cu-campus",
    zone_name: "Covenant University Campus",
    description: "Direct delivery to your hall or room",
    price: 1000,
    eta: "Same day (within 2-4 hours)",
    is_active: true,
    sort_order: 10,
  },
  {
    id: "zone-lagos-standard",
    zone_name: "Lagos Mainland & Island",
    description: "Doorstep delivery across Lagos",
    price: 2500,
    eta: "1-2 Business Days",
    is_active: true,
    sort_order: 20,
  },
  {
    id: "zone-nigeria-standard",
    zone_name: "Nationwide Courier",
    description: "Fast delivery anywhere in Nigeria",
    price: 4000,
    eta: "2-4 Business Days",
    is_active: true,
    sort_order: 30,
  },
];

export async function listActiveShippingMethods(): Promise<ShippingMethod[]> {
  try {
    const supabase = await createServerClient();
    if (!supabase) return defaultShippingMethods;

    // First try the dedicated shipping_methods table
    const { data: tableData, error: tableError } = await supabase
      .from("shipping_methods")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (!tableError && tableData && tableData.length > 0) {
      return tableData as ShippingMethod[];
    }

    // Fall back to site_content
    const { data: contentData } = await supabase
      .from("site_content")
      .select("value")
      .eq("key", "shipping_methods")
      .maybeSingle();

    if (contentData?.value && Array.isArray(contentData.value)) {
      return (contentData.value as ShippingMethod[]).filter((m) => m.is_active);
    }
  } catch (err) {
    console.error("Failed to list active shipping methods:", err);
  }

  return defaultShippingMethods;
}

export async function getAllShippingMethodsAdmin(): Promise<ShippingMethod[]> {
  try {
    const admin = createAdminClient();
    if (!admin) return defaultShippingMethods;

    const { data: tableData, error: tableError } = await admin
      .from("shipping_methods")
      .select("*")
      .order("sort_order", { ascending: true });

    if (!tableError && tableData && tableData.length > 0) {
      return tableData as ShippingMethod[];
    }

    const { data: contentData } = await admin
      .from("site_content")
      .select("value")
      .eq("key", "shipping_methods")
      .maybeSingle();

    if (contentData?.value && Array.isArray(contentData.value)) {
      return contentData.value as ShippingMethod[];
    }
  } catch (err) {
    console.error("Failed to get admin shipping methods:", err);
  }

  return defaultShippingMethods;
}

export async function saveShippingMethod(method: Partial<ShippingMethod> & { zone_name: string; price: number; eta: string }): Promise<ShippingMethod> {
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase admin client not available");

  const id = method.id || `zone-${Date.now()}`;
  const record: ShippingMethod = {
    id,
    zone_name: method.zone_name.trim(),
    description: (method.description || "").trim(),
    price: Number(method.price),
    eta: method.eta.trim(),
    is_active: method.is_active !== undefined ? method.is_active : true,
    sort_order: method.sort_order ?? 0,
  };

  // Attempt save to table
  const { error: tableError } = await admin.from("shipping_methods").upsert(record);

  // Also persist to site_content so it's always synchronized
  const { data: content } = await admin.from("site_content").select("value").eq("key", "shipping_methods").maybeSingle();
  let list = (content?.value as ShippingMethod[]) || defaultShippingMethods;
  const index = list.findIndex((m) => m.id === id);
  if (index >= 0) {
    list[index] = record;
  } else {
    list = [...list, record];
  }
  await admin.from("site_content").upsert({ key: "shipping_methods", value: list });

  return record;
}

export async function deleteShippingMethod(id: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase admin client not available");

  await admin.from("shipping_methods").delete().eq("id", id);

  const { data: content } = await admin.from("site_content").select("value").eq("key", "shipping_methods").maybeSingle();
  if (content?.value && Array.isArray(content.value)) {
    const list = (content.value as ShippingMethod[]).filter((m) => m.id !== id);
    await admin.from("site_content").upsert({ key: "shipping_methods", value: list });
  }
}
