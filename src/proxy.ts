import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const host = (
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    ""
  ).toLowerCase();

  const hostname = host.split(":")[0];
  const isShopSubdomain = hostname === "shop.fits4l.xyz";

  let rewriteUrl: URL | null = null;

  if (isShopSubdomain) {
    const { pathname, search } = request.nextUrl;

    if (pathname === "/" || pathname === "") {
      rewriteUrl = new URL(`/products${search}`, request.url);
    } else if (pathname === "/shop") {
      rewriteUrl = new URL(`/products${search}`, request.url);
    } else if (pathname.startsWith("/shop/")) {
      const rest = pathname.replace(/^\/shop/, "");
      rewriteUrl = new URL(`/products${rest}${search}`, request.url);
    } else {
      const isStandardRoute =
        pathname.startsWith("/products") ||
        pathname.startsWith("/cart") ||
        pathname.startsWith("/checkout") ||
        pathname.startsWith("/admin") ||
        pathname.startsWith("/auth") ||
        pathname.startsWith("/api") ||
        pathname.startsWith("/about") ||
        pathname.startsWith("/spotlight");

      if (!isStandardRoute) {
        rewriteUrl = new URL(`/products${pathname}${search}`, request.url);
      }
    }
  }

  let response = rewriteUrl
    ? NextResponse.rewrite(rewriteUrl, { request })
    : NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookies) {
        cookies.forEach(({ name, value }) => request.cookies.set(name, value));
        response = rewriteUrl
          ? NextResponse.rewrite(rewriteUrl, { request })
          : NextResponse.next({ request });
        cookies.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
