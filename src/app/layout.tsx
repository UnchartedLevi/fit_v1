import type { Metadata } from "next"; import "./globals.css"; import "./hero.css";
import { CartProvider } from "@/components/cart-provider"; import { SiteHeader } from "@/components/site-header"; import { SiteFooter } from "@/components/site-footer"; import { Toaster } from "sonner";
export const metadata:Metadata={title:{default:"FITS — Made for the game",template:"%s | FITS"},description:"Premium sportswear and football-inspired streetwear from Covenant University, Ota."};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body><CartProvider><SiteHeader/><main>{children}</main><SiteFooter/><Toaster position="top-center"/></CartProvider></body></html>}
