import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

const PUBLIC_PATHS = new Set(["/app/login"]);

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const { pathname, search } = nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    if (session) {
      const dashboardUrl = nextUrl.clone();
      dashboardUrl.pathname = "/app/dashboard";
      dashboardUrl.search = "";
      return NextResponse.redirect(dashboardUrl);
    }

    return NextResponse.next();
  }

  const requiresAuth = pathname.startsWith("/app") || pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  if (requiresAuth && !session) {
    const loginUrl = nextUrl.clone();
    loginUrl.pathname = "/app/login";
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin")) {
    const email = session?.user?.email?.toLowerCase() ?? "";
    if (!ADMIN_EMAILS.includes(email)) {
      const dashboardUrl = nextUrl.clone();
      dashboardUrl.pathname = "/app/dashboard";
      dashboardUrl.search = "";
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/app/:path*", "/admin/:path*", "/api/admin/:path*"],
};
