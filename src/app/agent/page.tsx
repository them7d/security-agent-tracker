"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AgentIdlePage } from "@/components/agent/agent-idle-page";
import { FullScreenLoader } from "@/components/common/full-screen-loader";

export default function AgentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  React.useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.replace("/login");
      return;
    }
    // Bounce supervisors to the dashboard
    if (session.user.role === "supervisor") {
      router.replace("/dashboard");
    }
  }, [session, status, router]);

  if (status === "loading" || !session?.user || session.user.role === "supervisor") {
    return (
      <FullScreenLoader
        label={
          status === "loading"
            ? "Loading…"
            : !session?.user
            ? "Redirecting to sign-in…"
            : "Redirecting to supervisor dashboard…"
        }
      />
    );
  }

  return <AgentIdlePage />;
}
