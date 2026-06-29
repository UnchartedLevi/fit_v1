import { Product } from "./types";

export const demoProducts: Product[] = [
  { id:"1", name:"FITS Core Jersey", slug:"fits-core-jersey", description:"A relaxed performance jersey cut for movement and everyday wear.", price:38000, category:"Jerseys", sizes:["S","M","L","XL"], images:[], stock_quantity:18, is_active:true, featured:true },
  { id:"2", name:"Monochrome Track Set", slug:"monochrome-track-set", description:"Structured two-piece track set with a clean monochrome finish.", price:65000, category:"Sets", sizes:["M","L","XL"], images:[], stock_quantity:9, is_active:true, featured:true },
  { id:"3", name:"F4L Heavyweight Tee", slug:"f4l-heavyweight-tee", description:"Premium heavyweight cotton, oversized shoulders and a crisp silhouette.", price:28000, category:"T-Shirts", sizes:["S","M","L","XL","XXL"], images:[], stock_quantity:24, is_active:true, featured:true },
  { id:"4", name:"Match Day Shorts", slug:"match-day-shorts", description:"Lightweight technical shorts made for match day and beyond.", price:24000, category:"Shorts", sizes:["S","M","L","XL"], images:[], stock_quantity:14, is_active:true },
  { id:"5", name:"Club Essential Cap", slug:"club-essential-cap", description:"Six-panel cotton cap with understated FITS detailing.", price:18000, category:"Accessories", sizes:["One Size"], images:[], stock_quantity:20, is_active:true },
  { id:"6", name:"Away Knit Jersey", slug:"away-knit-jersey", description:"Breathable knit jersey with contrast collar and relaxed fit.", price:42000, category:"Jerseys", sizes:["S","M","L","XL"], images:[], stock_quantity:7, is_active:true },
];

export const money = (amount:number) => new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN",maximumFractionDigits:0}).format(amount);

