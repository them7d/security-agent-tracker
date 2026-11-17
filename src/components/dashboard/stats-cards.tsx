"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, UserX, AlertTriangle } from "lucide-react";
import type { AgentDTO, AlertDTO } from "@/lib/types";

interface Props { agents: AgentDTO[]; alerts: AlertDTO[]; }

export function StatsCards({ agents, alerts }: Props) {
  const total = agents.length;
  const onDuty = agents.filter((a) => a.status === "on_duty" || a.status === "patrol").length;
  const offDuty = agents.filter((a) => a.status === "off_duty").length;
  const outside = agents.filter((a) => a.geofence.length >= 3 && !a.inGeofence).length;
  const activeAlerts = alerts.filter((a) => !a.read).length;

  const cards: Array<{
    label: string; value: string | number; hint: string;
    icon: React.ComponentType<{ className?: string }>;
    tone: "default" | "ok" | "warn" | "danger";
  }> = [
    { label: "Total agents", value: total,  hint: "On roster", icon: Users, tone: "default" },
    { label: "On duty",      value: onDuty,  hint: "Inside assigned zones", icon: UserCheck, tone: "ok" },
    { label: "Off duty",     value: offDuty, hint: "Inactive / departed", icon: UserX, tone: "warn" },
    { label: "Outside zone", value: outside, hint: "Geofence violations live", icon: AlertTriangle, tone: "danger" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        const toneClass =
          c.tone === "ok"      ? "text-emerald-400 bg-emerald-500/10 ring-emerald-500/30"
          : c.tone === "warn"  ? "text-amber-400 bg-amber-500/10 ring-amber-500/30"
          : c.tone === "danger"? "text-red-400 bg-red-500/10 ring-red-500/30"
          : "text-primary bg-primary/10 ring-primary/30";
        return (
          <Card key={c.label} className="border-border/60">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`h-10 w-10 rounded-md flex items-center justify-center ring-1 ${toneClass}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.label}</p>
                <p className="text-2xl font-semibold tabular leading-tight">{c.value}</p>
                <p className="text-[10px] text-muted-foreground truncate">{c.hint}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
      <Card className="border-border/60 sm:col-span-2 lg:col-span-4">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-md bg-red-500/10 ring-1 ring-red-500/30 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Active alerts</p>
            <p className="text-2xl font-semibold tabular leading-tight">{activeAlerts}</p>
            <p className="text-[10px] text-muted-foreground">Unread geofence & status notifications</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
