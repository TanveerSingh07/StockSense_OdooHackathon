import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },

  callbacks: {
    authorized: ({ token }) => {
      return !!token;
    },
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/products/:path*",
    "/receipts/:path*",
    "/deliveries/:path*",
    "/transfers/:path*",
    "/adjustments/:path*",
    "/history/:path*",
    "/settings/:path*",
    "/profile/:path*",
  ],
};