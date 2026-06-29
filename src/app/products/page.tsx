import { ProductsBrowser } from "@/components/products-browser";
export default async function Products({searchParams}:{searchParams:Promise<{category?:string}>}){const {category=""}=await searchParams;return <div className="page-shell"><span className="eyebrow">COLLECTION / ALL</span><h1 className="page-title">SHOP ALL.</h1><ProductsBrowser initialCategory={category}/></div>}

