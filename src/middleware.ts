import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedRoutes = [
  "/profile",
  "/notifications",
  "/admin",
  "/dashboard",
  "/jobs/post",
];

// Routes that should redirect to home if already authenticated
const authRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for access token in cookies (for SSR) or allow client-side check
  // Since we use localStorage, we'll let the client-side guards handle most auth
  // This middleware is mainly for basic route protection and redirects

  // For protected routes, we could add server-side token validation here
  // if needed, by checking a httpOnly cookie

  // Add security headers
  const response = NextResponse.next();

  // Security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
