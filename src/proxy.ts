import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_KEY } from "@/lib/auth/constants";

export function proxy(request: NextRequest) {
  const hasSession = request.cookies.get(SESSION_COOKIE_KEY)?.value === "1";
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === "/login";
  const isProtected = pathname.startsWith("/dashboard");

  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isLoginPage && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
