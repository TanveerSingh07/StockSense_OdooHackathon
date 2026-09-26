import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Retrieve token trying both insecure and secure cookie names
  const token =
    (await getToken({ req, secret: process.env.NEXTAUTH_SECRET, secureCookie: false })) ??
    (await getToken({ req, secret: process.env.NEXTAUTH_SECRET, secureCookie: true })) ??
    (await getToken({ req, secret: process.env.NEXTAUTH_SECRET }));

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/reset-password");

  const isAuthApi = pathname.startsWith("/api/auth");

  // If logged in and visiting auth pages, redirect to home
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // If not logged in and accessing protected route, redirect to login
  if (!token && !isAuthPage && !isAuthApi) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2)$).*)",
  ],
};