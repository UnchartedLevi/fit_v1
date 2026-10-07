// Run with node --env-file=.env.local scripts/sync-launch-categories.mjs
import { createClient } from '@supabase/supabase-js';
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const core = [['Football','football'],['Basketball','basketball'],['Tennis','tennis'],['Jerseys','jerseys'],['Gym & Fitness','gym-fitness'],['Accessories','accessories'],['Lifestyle','lifestyle']];
function checked(result) { if (result.error) throw new Error(result.error.message); return result.data; }
const before = checked(await client.from('categories').select('id,name,slug'));
checked(await client.from('categories').upsert(core.map(([name,slug],index) => ({name,slug,is_active:true,sort_order:(index+1)*10})), {onConflict:'slug'}));
const after = checked(await client.from('categories').select('id,name,slug'));
const allowed = after.filter(c => core.some(([,slug]) => slug === c.slug));
const retired = before.filter(c => !core.some(([,slug]) => slug === c.slug));
const fallback = allowed.find(c => c.slug === 'accessories');
const lifestyle = allowed.find(c => c.slug === 'lifestyle');
const replacement = id => {
  const category = after.find(c => c.id === id);
  if (allowed.some(c => c.id === id)) return id;
  return /fashion|lifestyle|swag|shirt|short|sets|bundles/i.test(category?.name || '') ? lifestyle.id : fallback.id;
};
const products = checked(await client.from('products').select('id,category_id'));
for (const product of products) {
  if (retired.some(c => c.id === product.category_id)) checked(await client.from('products').update({category_id:replacement(product.category_id)}).eq('id',product.id));
}
const content = checked(await client.from('site_content').select('value').eq('key','product_metadata').maybeSingle());
if (content?.value) {
  const metadata = structuredClone(content.value);
  for (const [id, meta] of Object.entries(metadata)) {
    const product = products.find(p => p.id === id);
    const ids = [...new Set((meta.category_ids?.length ? meta.category_ids : product?.category_id ? [product.category_id] : []).map(replacement))];
    meta.category_ids = ids;
    meta.categories = ids.map(id => allowed.find(c => c.id === id)?.name).filter(Boolean);
  }
  checked(await client.from('site_content').upsert({key:'product_metadata',value:metadata}));
}
for (const category of retired) checked(await client.from('categories').update({is_active:false}).eq('id',category.id));
console.log(`Configured ${allowed.length} launch categories and retired ${retired.length} obsolete categories. Product records preserved.`);
