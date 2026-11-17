import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

/**
 * Single Credentials provider that authenticates EITHER:
 *   - a Supervisor (role === "supervisor") via email + password, OR
 *   - an Agent        (role === "agent")       via badgeId + pin
 *
 * The role is passed in from the client via the `role` credential field.
 * The returned user object carries `role` and (for agents) `agentId`, which
 * are propagated through the JWT and Session callbacks below.
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/" },
  providers: [
    CredentialsProvider({
      name: "SentinelSec",
      credentials: {
        role:     { label: "Role",       type: "text"     },
        email:    { label: "Email",      type: "email"    },
        password: { label: "Password",   type: "password" },
        badgeId:  { label: "Badge ID",   type: "text"     },
        pin:      { label: "PIN",        type: "password" },
      },
      async authorize(credentials) {
        const role = credentials?.role;
        if (role === "agent") {
          const badgeId = credentials?.badgeId?.trim().toUpperCase();
          const pin = credentials?.pin?.trim() ?? "";
          if (!badgeId || !pin) return null;
          const agent = await db.agent.findUnique({ where: { badgeId } });
          if (!agent || agent.pin !== pin) return null;
          return {
            id: agent.id,
            name: agent.name,
            role: "agent",
            agentId: agent.id,
          };
        }

        // Default: supervisor
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
          role: "supervisor",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name ?? token.name;
        // @ts-expect-error — `role` and `agentId` are added by our custom user shape
        token.role = user.role;
        // @ts-expect-error — agentId only exists for agents
        if (user.agentId) token.agentId = user.agentId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? session.user.id;
        session.user.name = (token.name as string) ?? session.user.name;
        session.user.role = (token.role as "supervisor" | "agent") ?? "supervisor";
        if (token.agentId) session.user.agentId = token.agentId as string;
      }
      return session;
    },
  },
};
