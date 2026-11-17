import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/" },
  providers: [
    CredentialsProvider({
      name: "Supervisor",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";
        if (!email || !password) return null;

        const supervisor = await db.supervisor.findUnique({ where: { email } });
        if (!supervisor) return null;

        const ok = await bcrypt.compare(password, supervisor.passwordHash);
        if (!ok) return null;

        return {
          id: supervisor.id,
          email: supervisor.email,
          name: supervisor.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name ?? token.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string | undefined;
        session.user.name = (token.name as string) ?? session.user.name;
      }
      return session;
    },
  },
};

export type AuthSession = {
  user: { id: string; name?: string | null; email?: string | null };
} & {};
