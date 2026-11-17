"use client";

import * as React from "react";
import { TopBar } from "@/components/nav/topbar";
import { SideNav, type AppView } from "@/components/nav/side-nav";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { MapView } from "@/components/map/map-view";
import { LogsView } from "@/components/logs/logs-view";
import { useSeed } from "@/hooks/use-data";
import type { AgentDTO } from "@/lib/types";

/**
 * SupervisorShell — the supervisor's authenticated console.
 * Auth gate is handled by the /dashboard route, not here.
 */
export function SupervisorShell() {
  const [view, setView] = React.useState<AppView>("dashboard");
  const [focusAgent, setFocusAgent] = React.useState<AgentDTO | null>(null);
  const seed = useSeed();

  React.useEffect(() => {
    if (!seed.isPending && !seed.data) {
      seed.mutate(undefined, { onError: () => {/* ignore */} });
    }
  }, [seed]);

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
