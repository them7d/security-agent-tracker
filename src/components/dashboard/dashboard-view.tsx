"use client";

import { StatsCards } from "./stats-cards";
import { AgentsTable } from "./agents-table";
import { AddAgentDialog } from "./add-agent-dialog";
import { RecentOrders } from "./recent-orders";
import { ZoneStatusCard } from "./zone-status-card";
import { useAgents, useAlerts } from "@/hooks/use-data";
import type { AgentDTO } from "@/lib/types";

export function DashboardView({ onSelectAgent }: { onSelectAgent?: (a: AgentDTO) => void }) {
  const { data: agents = [] } = useAgents();
  const { data: alerts = [] } = useAlerts(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Operations dashboard</h1>
          <p className="text-xs text-muted-foreground">
            Live roster, status, and recent dispatch. Updates every few seconds.
          </p>
        </div>
        <AddAgentDialog />
      </div>
      <StatsCards agents={agents} alerts={alerts} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2"><AgentsTable onSelectAgent={onSelectAgent} /></div>
        <div className="space-y-4"><RecentOrders /><ZoneStatusCard /></div>
      </div>
    </div>
  );
}
