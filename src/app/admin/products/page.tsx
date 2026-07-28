import { AdminProductsEditor } from "@/components/admin-products-editor";

export default function Products() {
    return (
        <div className="admin-page">
            <section className="admin-page-header">
                <div>
                    <span className="eyebrow">CATALOGUE</span>
                    <h1>Products</h1>
                    <p>Manage product pricing, stock and images directly in FITS. Changes update the Supabase catalogue and appear on the storefront.</p>
                </div>
                <div className="admin-chip">Catalogue editor</div>
            </section>

            <section className="admin-panel admin-panel--wide">
                <div className="admin-panel__head">
                    <h2>Product manager</h2>
                    <p>Update one item or edit the whole collection in one place.</p>
                </div>
                <AdminProductsEditor />
            </section>
        </div>
    );
}
