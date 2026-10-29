import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = Boolean(req.auth);
  
  // 👇 Added "/forgot-password" to the list of public routes
  const isAuthRoute = 
    nextUrl.pathname === "/login" || 
    nextUrl.pathname === "/register" || 
    nextUrl.pathname === "/forgot-password";

  if (isAuthRoute) {
    // If the user is already logged in, redirect them away from login/register/forgot-password
    if (isLoggedIn) return Response.redirect(new URL("/dashboard", nextUrl));
    return;
  }

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  // Added api/ai to the exclusion list so Python can talk to Next.js freely
  matcher: ["/((?!api/ai|api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};