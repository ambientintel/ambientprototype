import { NextRequest, NextResponse } from "next/server";

const ELLA_HOST = "www.ellamemory.com";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  if (host !== ELLA_HOST) return NextResponse.next();

  const { pathname } = req.nextUrl;

  // Root → nurse dashboard
  if (pathname === "/") {
    return NextResponse.rewrite(new URL("/dashboard/overview", req.url));
  }

  // /dashboard/* already correct — pass through
  if (pathname.startsWith("/dashboard")) return NextResponse.next();

  // Everything else on this domain → redirect to dashboard
  return NextResponse.redirect(new URL("/dashboard/overview", req.url));
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|icon-.*|.*\\..*).*)"],
};
