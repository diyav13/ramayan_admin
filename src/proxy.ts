import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TOKEN_KEY = "ramayan_admin_token";

// Runs on the server BEFORE a page loads (Next.js 16 "proxy", formerly
// "middleware"). This is where we guard routes, similar to an auth check in a
// React Navigation navigator, but it happens before any UI reaches the browser.
export function proxy(request: NextRequest) {
  const token = request.cookies.get(TOKEN_KEY)?.value;
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === "/login";
  const isProtected = pathname.startsWith("/dashboard");

  // Not signed in and trying to open a protected page -> go to login.
  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Already signed in but on the login page -> go straight to dashboard.
  if (isLoginPage && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// Only run for these routes.
export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
