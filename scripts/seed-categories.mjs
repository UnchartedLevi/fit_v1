import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase URL or service role key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const categories = [
  { name: "Football", slug: "football", description: "Football boots, balls, kits and matchday gear.", is_active: true, sort_order: 10 },
  { name: "Basketball", slug: "basketball", description: "Basketballs, hoops gear and court essentials.", is_active: true, sort_order: 20 },
  { name: "Gym & Fitness", slug: "gym-fitness", description: "Training sets, gym wear and performance gear.", is_active: true, sort_order: 30 },
  { name: "Jerseys", slug: "jerseys", description: "Performance jerseys made for the pitch and campus.", is_active: true, sort_order: 40 },
  { name: "Accessories", slug: "accessories", description: "Caps, socks, bags and finishing details.", is_active: true, sort_order: 50 },
  { name: "Bundles", slug: "bundles", description: "Coordinated sets and bundled value packs.", is_active: true, sort_order: 60 },
  { name: "Fashion & Lifestyle", slug: "fashion-lifestyle", description: "Off-pitch lifestyle wear and campus street style.", is_active: true, sort_order: 70 },
];

async function run() {
  console.log("Upserting categories...");
  const { data, error } = await supabase.from("categories").upsert(categories, { onConflict: "slug" }).select();
  if (error) {
    console.error("Error upserting categories:", error);
    process.exit(1);
  }
  console.log("Categories upserted successfully:", data.map(c => c.name));
}

run();
