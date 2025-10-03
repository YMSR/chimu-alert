import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

const PUBLIC_PATHS = new Set(["/app/login"]);

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

  if (!session) {
    const loginUrl = nextUrl.clone();
    loginUrl.pathname = "/app/login";
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/app/:path*"],
};
