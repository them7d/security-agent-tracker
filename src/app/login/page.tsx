"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LoginCard } from "@/components/auth/login-card";
import { FullScreenLoader } from "@/components/common/full-screen-loader";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // If already authenticated, bounce to the role-appropriate page.
  React.useEffect(() => {
    if (status === "authenticated" && session?.user) {
      router.replace(session.user.role === "agent" ? "/agent" : "/dashboard");
    }
  }, [status, session, router]);

  if (status === "loading" || status === "authenticated") {
    return (
      <FullScreenLoader
        label={status === "authenticated" ? "Redirecting…" : "Loading session…"}
      />
    );
  }

  return <LoginCard />;
}
