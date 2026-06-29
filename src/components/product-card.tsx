"use client";
import Link from "next/link"; import { ProductVisual } from "./product-visual"; import { Product } from "@/lib/types"; import { money } from "@/lib/products";
export function ProductCard({product}:{product:Product}){return <article className="product-card"><Link href={`/products/${product.slug}`}><ProductVisual name={product.name} image={product.images[0]}/><div className="product-meta"><div><h3>{product.name}</h3><p>{product.category}</p></div><b>{money(product.price)}</b></div></Link></article>}

