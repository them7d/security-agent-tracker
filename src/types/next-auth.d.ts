import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: "supervisor" | "agent";
      agentId?: string;
    };
  }

  interface User {
    role?: "supervisor" | "agent";
    agentId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "supervisor" | "agent";
    agentId?: string;
  }
}
