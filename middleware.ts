import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Rotas que exigem role OWNER ou ADMIN
    const adminRoutes = ["/dashboard/settings", "/dashboard/team"];
    const isAdminRoute = adminRoutes.some((r) => pathname.startsWith(r));

    if (isAdminRoute && !["OWNER", "ADMIN"].includes(token?.role as string)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*"],
};
