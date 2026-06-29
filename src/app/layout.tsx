import type { Metadata } from "next"; import { Space_Grotesk } from "next/font/google"; import "./globals.css"; import "./hero.css";
import { CartProvider } from "@/components/cart-provider"; import { SiteHeader } from "@/components/site-header"; import { SiteFooter } from "@/components/site-footer"; import { Toaster } from "sonner";
const font=Space_Grotesk({subsets:["latin"]});
export const metadata:Metadata={title:{default:"FITS — Made for the game",template:"%s | FITS"},description:"Premium sportswear and football-inspired streetwear from Lagos."};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body className={font.className}><CartProvider><SiteHeader/><main>{children}</main><SiteFooter/><Toaster position="top-center"/></CartProvider></body></html>}
