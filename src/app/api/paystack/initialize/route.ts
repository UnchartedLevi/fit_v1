import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
const Body=z.object({customer:z.object({name:z.string().min(2),email:z.string().email(),phone:z.string().min(7),city:z.string().min(2),address:z.string().min(5)}),items:z.array(z.object({product_id:z.string(),size:z.string(),quantity:z.number().int().positive()})).min(1)});
export async function POST(req:Request){try{
 const secret=process.env.PAYSTACK_SECRET_KEY;if(!secret)throw new Error("Paystack is not configured yet.");
 const body=Body.parse(await req.json()),session=await createClient(),supabase=createAdminClient();if(!session||!supabase)throw new Error("Supabase is not configured yet.");
 const ids=body.items.map(x=>x.product_id),{data:products,error}=await supabase.from("products").select("id,price,stock_quantity,is_active").in("id",ids);if(error||!products)throw new Error("Could not validate products.");
 let total=0;for(const item of body.items){const p=products.find(x=>x.id===item.product_id);if(!p?.is_active||p.stock_quantity<item.quantity)throw new Error("A product is unavailable or has insufficient stock.");total+=p.price*item.quantity}
 const {data:{user}}=await session.auth.getUser(),reference=`FITS-${Date.now()}-${crypto.randomUUID().slice(0,8)}`;
 const {data:order,error:orderError}=await supabase.from("orders").insert({user_id:user?.id||null,customer_name:body.customer.name,customer_email:body.customer.email,customer_phone:body.customer.phone,delivery_address:`${body.customer.address}, ${body.customer.city}`,total_amount:total,payment_status:"pending",order_status:"pending",paystack_reference:reference}).select().single();if(orderError)throw orderError;
 await supabase.from("order_items").insert(body.items.map(i=>{const p=products.find(x=>x.id===i.product_id)!;return {order_id:order.id,product_id:i.product_id,size:i.size,quantity:i.quantity,unit_price:p.price}}));
 const origin=new URL(req.url).origin,pay=await fetch("https://api.paystack.co/transaction/initialize",{method:"POST",headers:{Authorization:`Bearer ${secret}`,"Content-Type":"application/json"},body:JSON.stringify({email:body.customer.email,amount:total*100,reference,callback_url:`${origin}/checkout/callback`,metadata:{order_id:order.id}})}),json=await pay.json();if(!pay.ok||!json.status)throw new Error(json.message||"Payment initialization failed.");
 await supabase.from("payments").insert({order_id:order.id,user_id:user?.id||null,amount:total,status:"pending",paystack_reference:reference});return NextResponse.json(json.data)
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Invalid request"},{status:400})}}
