"use client";
import { useMemo, useState } from "react"; import { demoProducts } from "@/lib/products"; import { ProductCard } from "./product-card";
export function ProductsBrowser({initialCategory=""}:{initialCategory?:string}){
 const [category,setCategory]=useState(initialCategory),[size,setSize]=useState(""),[sort,setSort]=useState("new");
 const products=useMemo(()=>demoProducts.filter(p=>(!category||p.category===category)&&(!size||p.sizes.includes(size))).sort((a,b)=>sort==="low"?a.price-b.price:sort==="high"?b.price-a.price:Number(b.id)-Number(a.id)),[category,size,sort]);
 return <><div className="filters"><select value={category} onChange={e=>setCategory(e.target.value)} aria-label="Category"><option value="">All categories</option>{[...new Set(demoProducts.map(x=>x.category))].map(x=><option key={x}>{x}</option>)}</select><select value={size} onChange={e=>setSize(e.target.value)} aria-label="Size"><option value="">All sizes</option>{["S","M","L","XL","XXL"].map(x=><option key={x}>{x}</option>)}</select><select value={sort} onChange={e=>setSort(e.target.value)} aria-label="Sort"><option value="new">Newest</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></div>{products.length?<div className="product-grid">{products.map(p=><ProductCard key={p.id} product={p}/>)}</div>:<div className="empty">No pieces match these filters.</div>}</>
}

