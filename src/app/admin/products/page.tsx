import { AdminProductsEditor } from "@/components/admin-products-editor";

export default function Products() {
    return (
        <>
            <span className="eyebrow">CATALOGUE</span>
            <h1>Products</h1>
            <p>Manage product pricing, stock and images directly in FITS. Changes update the Supabase catalogue and appear on the storefront.</p>
            <AdminProductsEditor />
        </>
    );
}
