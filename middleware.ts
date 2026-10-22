import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "@/lib/auth";

// Public static files that must always be accessible
const PUBLIC_STATIC_FILES = [
  "/favicon.ico",
  "/sw.js",
  "/manifest.webmanifest",
  "/manifest.json",
  "/robots.txt",
  "/sitemap.xml",
];

// Unauthenticated auth pages (logged-in users will be redirected to /dashboard)
const AUTH_PAGES = ["/sign-in", "/forgot-password", "/reset-password"];

// Public informational pages (accessible to all)
const PUBLIC_PAGES = ["/privacy"];

// Public unauthenticated API endpoints
const PUBLIC_APIS = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/google/connect",
  "/api/google/callback",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Always allow static public assets
  if (PUBLIC_STATIC_FILES.includes(pathname)) {
    return NextResponse.next();
  }

  // 2. Verify session cookie
  const token = request.cookies.get("session")?.value;
  let isAuthenticated = false;
  if (token) {
    const payload = await verifyJWT(token);
    if (payload) {
      isAuthenticated = true;
    }
  }

  // 3. Handle root page "/"
  if (pathname === "/") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // 4. Handle auth pages (/sign-in, /forgot-password, /reset-password)
  const isAuthPage = AUTH_PAGES.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`)
  );
  if (isAuthPage) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // 5. Handle public pages (/privacy)
  const isPublicPage = PUBLIC_PAGES.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`)
  );
  if (isPublicPage) {
    return NextResponse.next();
  }

  // 6. Handle API routes
  if (pathname.startsWith("/api")) {
    const isPublicApi = PUBLIC_APIS.some(
      (api) => pathname === api || pathname.startsWith(`${api}/`)
    );
    if (isPublicApi || isAuthenticated) {
      return NextResponse.next();
    }
    return NextResponse.json(
      { error: "Unauthorized access. Please sign in." },
      { status: 401 }
    );
  }

  // 7. ALL OTHER PAGES ARE PROTECTED BY DEFAULT (/parents, /teachers, /bank-transactions, /dashboard, etc.)
  if (!isAuthenticated) {
    const signInUrl = new URL("/sign-in", request.url);
    const callbackPath = pathname + request.nextUrl.search;
    signInUrl.searchParams.set("callbackUrl", callbackPath);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, logo images, public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp)$).*)",
  ],
};
