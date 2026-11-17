"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { SupervisorShell } from "@/components/app/supervisor-shell";
import { FullScreenLoader } from "@/components/common/full-screen-loader";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  React.useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.replace("/login");
      return;
    }
    // Bounce agents to their own console
    if (session.user.role === "agent") {
      router.replace("/agent");
    }
  }, [session, status, router]);

  if (status === "loading" || !session?.user || session.user.role === "agent") {
    return (
      <FullScreenLoader
        label={
          status === "loading"
            ? "Loading…"
            : !session?.user
            ? "Redirecting to sign-in…"
            : "Redirecting to agent console…"
        }
      />
    );
  }

  return <SupervisorShell />;
}
