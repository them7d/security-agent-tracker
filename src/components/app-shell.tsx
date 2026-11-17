"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { TopBar } from "@/components/nav/topbar";
import { SideNav, type AppView } from "@/components/nav/side-nav";
import { LoginCard } from "@/components/auth/login-card";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { MapView } from "@/components/map/map-view";
import { LogsView } from "@/components/logs/logs-view";
import { useSeed } from "@/hooks/use-data";
import { Skeleton } from "@/components/ui/skeleton";
import type { AgentDTO } from "@/lib/types";

export function AppShell() {
  const { data: session, status } = useSession();
  const [view, setView] = React.useState<AppView>("dashboard");
  const [focusAgent, setFocusAgent] = React.useState<AgentDTO | null>(null);
  const seed = useSeed();

  // Ensure demo data exists on first authenticated render
  React.useEffect(() => {
    if (status === "authenticated" && !seed.isPending && !seed.data) {
      seed.mutate(undefined, { onError: () => {/* ignore */} });
    }
  }, [status, seed]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  if (!session?.user) {
    return <LoginCard />;
  }

  function focusOnAgent(agent: AgentDTO) {
    setFocusAgent(agent);
    setView("map");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopBar />
      <div className="flex-1 flex min-h-0">
        <SideNav current={view} onChange={setView} />
        <main className="flex-1 min-w-0 p-4 md:p-6 overflow-auto">
          {view === "dashboard" && <DashboardView onSelectAgent={focusOnAgent} />}
          {view === "map" && (
            <MapView
              focusAgentId={focusAgent?.id ?? null}
              onConsumeFocus={() => setFocusAgent(null)}
            />
          )}
          {view === "logs" && <LogsView />}
        </main>
      </div>
    </div>
  );
}
