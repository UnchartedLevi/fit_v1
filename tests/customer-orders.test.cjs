const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, mocks) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, { exports, Intl, Date, require: (name) => name in mocks ? mocks[name] : require(name) });
  return exports;
}
const ownId = '00000000-0000-4000-8000-000000000001';
const otherId = '00000000-0000-4000-8000-000000000002';
function fixture(user = { id: 'owner', email: 'owner@example.com' }, fail = false) {
  const calls = [];
  const rows = [{ id: ownId, user_id: 'owner' }, { id: otherId, user_id: 'someone-else' }, { id: '00000000-0000-4000-8000-000000000003', user_id: null }];
  const supabase = {
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    from(table) {
      calls.push(['from', table]);
      const filters = [];
      const result = () => ({ data: rows.filter((row) => filters.every(([key, value]) => row[key] === value)), count: 1, error: fail ? {message:'database unavailable'} : null });
      const query = {
        select(...args) { calls.push(['select', ...args]); return query; },
        eq(key, value) { filters.push([key, value]); calls.push(['eq', key, value]); return query; },
        order(...args) { calls.push(['order', ...args]); return query; },
        async range(...args) { calls.push(['range', ...args]); return result(); },
        async maybeSingle() { const response = result(); return { ...response, data: response.data[0] ?? null }; },
      };
      return query;
    },
  };
  const module = load('src/lib/customer-orders.ts', {
    'next/navigation': { redirect(url) { throw new Error(`REDIRECT:${url}`); } },
    '@/lib/supabase/server': { createClient: async () => supabase },
  });
  return { module, calls };
}
test('signed-out visitors are redirected before any order query', async () => {
  const {module,calls} = fixture(null);
  await assert.rejects(module.listCustomerOrders(1), /REDIRECT:\/auth\/login\?next=%2Faccount/);
  await assert.rejects(module.getCustomerOrder(ownId, true), /receipt/);
  assert.equal(calls.length, 0);
});
test('history queries scope the authenticated owner and paginate newest first', async () => {
  const {module,calls} = fixture();
  const response = await module.listCustomerOrders(2);
  assert.equal(response.orders.length,1);
  assert.equal(response.orders[0].id,ownId);
  assert.ok(calls.some(c => c[0]==='eq' && c[1]==='user_id' && c[2]==='owner'));
  assert.ok(calls.some(c => c[0]==='range' && c[1]===12 && c[2]===23));
  assert.ok(calls.some(c => c[0]==='order' && c[1]==='created_at' && c[2].ascending===false));
});
test('order details and receipts cannot retrieve another customer order', async () => {
  const {module} = fixture();
  assert.equal((await module.getCustomerOrder(ownId)).id,ownId);
  assert.equal(await module.getCustomerOrder(otherId),null);
  assert.equal(await module.getCustomerOrder(otherId,true),null);
  assert.equal(await module.getCustomerOrder('00000000-0000-4000-8000-000000000003'),null);
  const admin=fixture({id:'admin',email:'admin@example.com'}).module;
  assert.equal(await admin.getCustomerOrder(ownId),null);
});
test('malformed order IDs do not reach the database', async () => {
  const {module,calls} = fixture();
  assert.equal(await module.getCustomerOrder('bad-id'),null);
  assert.equal(calls.length,0);
});
test('database errors do not masquerade as empty histories', async () => {
  const {module} = fixture(undefined,true);
  await assert.rejects(module.listCustomerOrders(1),/Unable to load/);
  await assert.rejects(module.getCustomerOrder(ownId),/Unable to load/);
});
test('delivery progress does not imply dispatch for unpaid, refunded or cancelled orders', () => {
  const {module} = fixture();
  const order={payment_status:'paid',fulfilment_status:'unfulfilled',status:'confirmed'};
  for (const [index,status] of ['unfulfilled','processing','shipped','delivered'].entries()) assert.equal(module.deliveryProgress({...order,fulfilment_status:status}).step,index);
  assert.equal(module.deliveryProgress({...order,payment_status:'pending'}).step,-1);
  assert.equal(module.deliveryProgress({...order,payment_status:'refunded'}).step,-1);
  assert.equal(module.deliveryProgress({...order,status:'cancelled'}).step,-1);
});
test('receipt route only renders paid orders', async () => {
  for (const status of ['pending','failed','refunded','paid']) {
    const receipt=load('src/app/account/orders/[id]/receipt/page.tsx',{
      'next/link':{default:()=>null},
      'next/navigation':{notFound(){throw new Error('NOT_FOUND');}},
      '@/lib/customer-orders':{getCustomerOrder:async()=>({id:ownId,payment_status:status})},
      '@/components/customer-order-summary':{CustomerOrderSummary:()=>null},
      '@/components/print-receipt-button':{PrintReceiptButton:()=>null},
    });
    const render=receipt.default({params:Promise.resolve({id:ownId})});
    if(status==='paid') assert.ok(await render); else await assert.rejects(render,/NOT_FOUND/);
  }
});
test('order details and receipts hide historical delivery time estimates', () => {
  const summary=load('src/components/customer-order-summary.tsx', {
    '@/lib/products':{money:amount=>`NGN ${amount}`},
    '@/lib/customer-orders':{orderDate:()=> '10 Oct 2026'},
  });
  const order={order_number:'FITS-TEST',payment_status:'paid',created_at:'2026-10-10',paid_at:null,
    order_items:[],subtotal:1000,discount_amount:0,delivery_fee:499,tax_amount:0,total_amount:1499,
    customer_email:'test@example.com',customer_phone:'+2349123456789',paystack_reference:'TEST',
    delivery_address_snapshot:{shipping_zone:'Covenant University Campus',address_line_1:'Peter B205',shipping_eta:'Same Day (6 - 8pm everyday)'}};
  const html=require('react-dom/server').renderToStaticMarkup(require('react').createElement(summary.CustomerOrderSummary,{order}));
  assert.ok(html.includes('Covenant University Campus'));
  assert.ok(html.includes('NGN 499'));
  assert.ok(!html.includes('Same Day'));
  assert.ok(!html.includes('Estimated delivery'));
  assert.ok(!html.includes('8pm'));
});
