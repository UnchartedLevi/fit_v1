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
const phone = load('src/lib/checkout-phone.ts', {});
test('contact number follows payment number until manually edited', () => {
  let details = { phone: '', contactPhone: '', contactPhoneEdited: false, name: 'Shopper' };
  details = phone.updateCheckoutPhone(details, 'phone', '09123456789');
  assert.equal(details.phone, '9123456789');
  assert.equal(details.contactPhone, '9123456789');
  details = phone.updateCheckoutPhone(details, 'phone', '08012345678');
  assert.equal(details.contactPhone, '8012345678');
  details = phone.updateCheckoutPhone(details, 'contactPhone', '08123456789');
  details = phone.updateCheckoutPhone(details, 'phone', '09012345678');
  assert.equal(details.phone, '9012345678');
  assert.equal(details.contactPhone, '8123456789');
  assert.equal(details.name, 'Shopper');
  details = phone.updateCheckoutPhone(details, 'contactPhone', '');
  details = phone.updateCheckoutPhone(details, 'phone', '09123456789');
  assert.equal(details.contactPhone, '');
});
test('phone input strips country/local prefixes, letters and extra digits', () => {
  for (const value of ['09123456789', '+234 912 345 6789', '9123456789']) {
    assert.equal(phone.phoneInputDigits(value), '9123456789');
  }
  assert.equal(phone.phoneInputDigits('abc912345678999'), '9123456789');
});
test('phone validation normalizes Nigerian mobile numbers and rejects invalid values', () => {
  for (const value of ['09123456789', '+234 912 345 6789', '9123456789']) {
    assert.equal(phone.checkoutPhoneSchema.parse(value), '+2349123456789');
  }
  for (const value of ['', '912345678', '91234567890', '1234567890', '+449123456789', 'abc9123456789']) {
    assert.equal(phone.checkoutPhoneSchema.safeParse(value).success, false, value);
  }
});
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
async function checkout(freeShipping, customerPhone = '09123456789', invalid = false, contactPhone) {
  const productId='00000000-0000-4000-8000-000000000001', variantId='00000000-0000-4000-8000-000000000002';
  let savedOrder, charged, metadata;
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
    '@/lib/checkout-phone':phone,
    '@/lib/coupons':{validateCoupon:async()=>({valid:true,discount:freeShipping?0:200,freeShipping})},
  },{fetch:async(url,options)=>{const payload=JSON.parse(options.body);charged=payload.amount;metadata=payload.metadata;return {ok:true,json:async()=>({status:true,data:{authorization_url:'https://checkout.paystack.com/mock'}})};}});
  const response = await route.POST({url:'https://fits4l.xyz/api/paystack/initialize',json:async()=>({customer:{name:'@testshopper',email:'test@example.com',phone:customerPhone,contact_phone:contactPhone,address:'Paul 1'},items:[{product_id:productId,variant_id:variantId,quantity:1}],shipping:{id:'shipping',zone_name:'Forged zone',price:0},coupon:{code:'TEST',discount:999999}})});
  if (invalid) {
    assert.equal(response.status,400);
    assert.match(response.data.error,/10 digits after \+234/);
    assert.equal(savedOrder,undefined);
    assert.equal(charged,undefined);
    return;
  }
  assert.equal(response.status,200);
  const expectedContact=contactPhone ? phone.checkoutPhoneSchema.parse(contactPhone) : '+2349123456789';
  assert.equal(savedOrder.customer_phone,expectedContact);
  assert.equal(savedOrder.delivery_address_snapshot.phone,expectedContact);
  assert.equal(savedOrder.delivery_address_snapshot.payment_phone,'+2349123456789');
  assert.equal(metadata.payment_phone,'+2349123456789');
  assert.equal(metadata.contact_phone,expectedContact);
  assert.equal(savedOrder.delivery_address_snapshot.recipient_name,'@testshopper');
  assert.equal(savedOrder.delivery_address_snapshot.address_line_1,'Paul 1');
  assert.equal(savedOrder.delivery_address_snapshot.shipping_zone,'Campus');
  assert.equal(savedOrder.delivery_fee,freeShipping?0:1000);
  assert.equal(savedOrder.discount_amount,freeShipping?0:200);
  assert.equal(charged,freeShipping?200000:280000);
}
test('checkout ignores browser-supplied shipping prices and discounts',()=>checkout(false));
test('free shipping removes the delivery fee from both order and gateway charge',()=>checkout(true));
test('invalid phone is rejected before saving an order or initializing payment',()=>checkout(false,'912345678900',true));
test('different contact number is used for delivery while payment number is preserved',()=>checkout(false,'09123456789',false,'08012345678'));
test('invalid contact number is rejected before saving an order',()=>checkout(false,'09123456789',true,'912345678900'));
