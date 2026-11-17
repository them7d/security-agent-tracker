"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAlerts } from "@/hooks/use-data";
import { timeAgo } from "@/lib/format";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ZoneStatusCard() {
  const { data: alerts = [] } = useAlerts(false);

  // Most recent geofence alerts for the side panel
  const geofenceAlerts = alerts
    .filter((a) => a.type === "geofence_exit" || a.type === "geofence_reenter")
    .slice(0, 12);

  return (
    <Card className="border-border/60">
      <CardHeader className="py-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" /> Geofence events
        </CardTitle>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
          {geofenceAlerts.length}
        </span>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-72">
          {geofenceAlerts.length === 0 ? (
            <div className="p-8 flex flex-col items-center gap-2 text-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              <p className="text-xs text-muted-foreground">
                All agents within their assigned zones.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {geofenceAlerts.map((a) => {
                const isExit = a.type === "geofence_exit";
                return (
                  <li key={a.id} className="px-4 py-2.5">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isExit ? "bg-red-400" : "bg-emerald-400"
                        }`}
                      />
                      <span className="text-[10px] uppercase tracking-wider font-medium">
                        {isExit ? "Exit" : "Re-enter"}
                      </span>
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        {timeAgo(a.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/90 line-clamp-2">
                      {a.agentName} <span className="text-muted-foreground font-mono">({a.agentBadge})</span>
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
