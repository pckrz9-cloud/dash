import { withAuth } from "next-auth/middleware";

// Every page and API route requires a session except login, signup, the
// NextAuth endpoints, and the secret-protected cron endpoint.
export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: [
    "/((?!login|signup|api/auth|api/signup|api/cron|api/hooks|_next/static|_next/image|favicon.ico).*)",
  ],
};
