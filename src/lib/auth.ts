import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Zero-setup admin: the first time someone logs in with ADMIN_EMAIL, the
// admin account is created from the ADMIN_EMAIL/ADMIN_PASSWORD env vars —
// no seed script or terminal required.
async function ensureAdminAccount(email: string) {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword || email !== adminEmail) return;
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) return;
  await prisma.user.create({
    data: {
      email: adminEmail,
      name: process.env.ADMIN_NAME ?? "Agency Admin",
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: "ADMIN",
    },
  });
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const email = credentials.email.toLowerCase().trim();
        await ensureAdminAccount(email);
        const user = await prisma.user.findUnique({
          where: { email },
        });
        if (!user) return null;
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "CLIENT";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};
