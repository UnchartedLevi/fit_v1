const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, mocks, extras = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require: name => name in mocks ? mocks[name] : require(name), console, URL, crypto: require('node:crypto').webcrypto, process: {env: {PAYSTACK_SECRET_KEY:'mock-secret'}}, ...extras });
  return exports;
}
function couponsModule(coupon) {
  const client = {from(table) { const query = {select:()=>query,order:async()=>({data:[coupon]}),eq:()=>query,maybeSingle:async()=>({data:null})}; return query; }};
  return load('src/lib/coupons.ts', {'@/lib/supabase/admin': {createAdminClient:()=>client}});
}
const item = {product:{is_sbu:true},quantity:2,unitPrice:1000};
test('free shipping respects minimum spend and works for products excluded from item discounts', async()=>{
  const module = couponsModule({code:'SHIP',type:'free_shipping',value:0,min_spend:1000,is_active:true});
  assert.equal((await module.validateCoupon('ship',[{...item,product:{is_sbu:false}}],2000)).freeShipping,true);
  assert.equal((await module.validateCoupon('SHIP',[item],500)).valid,false);
});
test('percentage and fixed coupons only discount eligible products',async()=>{
  const percentage = couponsModule({code:'TEN',type:'percentage',value:10,is_active:true});
  assert.equal((await percentage.validateCoupon('TEN',[item,{...item,product:{is_sbu:false}}],4000)).discount,200);
  const fixed = couponsModule({code:'FIXED',type:'fixed',value:3000,is_active:true});
  assert.equal((await fixed.validateCoupon('FIXED',[item],2000)).discount,2000);
});
test('inactive coupons cannot be applied',async()=>{
  assert.equal((await couponsModule({code:'OFF',is_active:false}).validateCoupon('OFF',[item],2000)).valid,false);
});
async function checkout(freeShipping) {
  const productId='00000000-0000-4000-8000-000000000001', variantId='00000000-0000-4000-8000-000000000002';
  let savedOrder, charged;
  const client = {from(table) {
    let payload;
    const query = {
      select:()=>query,
      in:async()=>({data:table==='products'?[{id:productId,name:'Ball',base_price:2000,currency:'NGN',status:'active'}]:table==='product_variants'?[{id:variantId,product_id:productId,is_active:true,stock_quantity:10}]:[],error:null}),
      insert(data) {payload=data;if(table==='orders') savedOrder=data;return query;},
      single:async()=>({data:{id:'order-1'},error:null}),
      then(resolve) {resolve({data:payload,error:null});},
    };return query;
  }};
  const route = load('src/app/api/paystack/initialize/route.ts', {
    'next/server':{NextResponse:{json:(data,options)=>({data,status:options?.status??200})}},
    '@/lib/supabase/admin':{createAdminClient:()=>client}, '@/lib/supabase/server':{createClient:async()=>null},
    '@/lib/product-options':{getProductPurchaseMode:()=> 'single',getVariantChoiceLabel:()=> 'Item'},
    '@/lib/shipping':{listActiveShippingMethods:async()=>[{id:'shipping',price:1000,zone_name:'Campus',eta:'Today'}]},
    '@/lib/catalogue':{listProducts:async()=>[{id:productId,is_sbu:true}]},
    '@/lib/coupons':{validateCoupon:async()=>({valid:true,discount:freeShipping?0:200,freeShipping})},
  },{fetch:async(url,options)=>{charged=JSON.parse(options.body).amount;return {ok:true,json:async()=>({status:true,data:{authorization_url:'https://checkout.paystack.com/mock'}})};}});
  const response = await route.POST({url:'https://fits4l.xyz/api/paystack/initialize',json:async()=>({customer:{name:'Test Shopper',email:'test@example.com',phone:'1234567890',address:'Test address'},items:[{product_id:productId,variant_id:variantId,quantity:1}],shipping:{id:'shipping',zone_name:'Forged zone',price:0},coupon:{code:'TEST',discount:999999}})});
  assert.equal(response.status,200);
  assert.equal(savedOrder.delivery_address_snapshot.shipping_zone,'Campus');
  assert.equal(savedOrder.delivery_fee,freeShipping?0:1000);
  assert.equal(savedOrder.discount_amount,freeShipping?0:200);
  assert.equal(charged,freeShipping?200000:280000);
}
test('checkout ignores browser-supplied shipping prices and discounts',()=>checkout(false));
test('free shipping removes the delivery fee from both order and gateway charge',()=>checkout(true));
