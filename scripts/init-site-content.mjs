import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase URL or service role key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const initialShippingMethods = [
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

const initialCoupons = [
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

async function run() {
  console.log("Checking and initializing site_content data...");
  const { data: existingShipping } = await supabase.from("site_content").select("value").eq("key", "shipping_methods").maybeSingle();
  if (!existingShipping) {
    await supabase.from("site_content").upsert({ key: "shipping_methods", value: initialShippingMethods });
    console.log("Initialized shipping_methods in site_content");
  } else {
    console.log("shipping_methods already present in site_content");
  }

  const { data: existingCoupons } = await supabase.from("site_content").select("value").eq("key", "coupon_codes").maybeSingle();
  if (!existingCoupons) {
    await supabase.from("site_content").upsert({ key: "coupon_codes", value: initialCoupons });
    console.log("Initialized coupon_codes in site_content");
  } else {
    console.log("coupon_codes already present in site_content");
  }
}

run();
