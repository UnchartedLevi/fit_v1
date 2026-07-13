"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { CartItem, Product } from "@/lib/types";
import { toast } from "sonner";

type CartContextValue={items:CartItem[];count:number;subtotal:number;add:(p:Product,size:string,q?:number)=>void;update:(id:string,size:string,q:number)=>void;remove:(id:string,size:string)=>void;clear:()=>void};
const CartContext=createContext<CartContextValue|null>(null);
export function CartProvider({children}:{children:React.ReactNode}){
 const [items,setItems]=useState<CartItem[]>([]);
 const [ready,setReady]=useState(false);
 useEffect(()=>{const timer=window.setTimeout(()=>{try{setItems(JSON.parse(localStorage.getItem("fits-cart")||"[]"))}catch{setItems([])}finally{setReady(true)}},0);return()=>window.clearTimeout(timer)},[]);
 useEffect(()=>{if(ready)localStorage.setItem("fits-cart",JSON.stringify(items))},[items,ready]);
 const value=useMemo(()=>({items,count:items.reduce((a,x)=>a+x.quantity,0),subtotal:items.reduce((a,x)=>a+x.quantity*x.product.price,0),
 add:(product:Product,size:string,quantity=1)=>{setItems(cur=>{const found=cur.find(x=>x.product.id===product.id&&x.size===size);return found?cur.map(x=>x===found?{...x,quantity:Math.min(product.stock_quantity,x.quantity+quantity)}:x):[...cur,{product,size,quantity}]});toast.success("Added to bag")},
 update:(id:string,size:string,q:number)=>setItems(cur=>cur.map(x=>x.product.id===id&&x.size===size?{...x,quantity:Math.max(1,Math.min(x.product.stock_quantity,q))}:x)),
 remove:(id:string,size:string)=>setItems(cur=>cur.filter(x=>!(x.product.id===id&&x.size===size))),clear:()=>setItems([])}),[items]);
 return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
export const useCart=()=>{const x=useContext(CartContext);if(!x)throw new Error("CartProvider missing");return x};
