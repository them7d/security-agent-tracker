"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogIn, LogOut, AlertTriangle, ShieldCheck, ScrollText, Bell, CheckCircle2, X } from "lucide-react";
import { useLogs, useAlerts, useDismissAlert, useAgents } from "@/hooks/use-data";
import { fmtDateTime, timeAgo } from "@/lib/format";
import type { AttendanceLogDTO, AttendanceLogType } from "@/lib/types";

const LOG_META: Record<AttendanceLogType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  check_in:         { label: "Check-in",          icon: LogIn,         color: "text-emerald-300" },
  check_out:        { label: "Check-out",         icon: LogOut,        color: "text-red-300" },
  geofence_exit:    { label: "Geofence exit",     icon: AlertTriangle, color: "text-red-300" },
  geofence_reenter: { label: "Geofence re-enter", icon: ShieldCheck,   color: "text-emerald-300" },
  manual:           { label: "Manual",            icon: ScrollText,    color: "text-muted-foreground" },
};

export function LogsView() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { data: logs, isLoading } = useLogs(typeFilter === "all" ? undefined : { type: typeFilter });
  const { data: alerts = [] } = useAlerts(false);
  const { data: agents = [] } = useAgents();
  const dismiss = useDismissAlert();
  const unread = alerts.filter((a) => !a.read);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Attendance & alert logs</h1>
        <p className="text-xs text-muted-foreground">
          Full audit trail of geofence transitions, shift check-in / check-out and supervisor alerts.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/60 lg:col-span-1">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-400" /> Supervisor alerts
            </CardTitle>
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-border font-mono">{unread.length} unread</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[480px]">
              {isLoading && alerts.length === 0 ? (
                <div className="p-4 space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
              ) : alerts.length === 0 ? (
                <div className="p-8 flex flex-col items-center gap-2 text-center">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  <p className="text-xs text-muted-foreground">No alerts recorded.</p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {alerts.map((a) => {
                    const isExit = a.type === "geofence_exit";
                    const agent = agents.find((x) => x.id === a.agentId);
                    return (
                      <li key={a.id} className={`px-4 py-2.5 ${!a.read ? "bg-amber-500/5" : ""}`}>
                        <div className="flex items-start gap-2">
                          <div className={`mt-1 h-1.5 w-1.5 rounded-full ${isExit ? "bg-red-400" : "bg-emerald-400"}`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-medium truncate">{a.agentName ?? "Agent"} · <span className="font-mono">{a.agentBadge}</span></span>
                              <span className="ml-auto text-[10px] text-muted-foreground">{timeAgo(a.createdAt)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{a.message}</p>
                            {agent && <p className="text-[10px] text-muted-foreground mt-0.5">Status: <span className="font-mono">{agent.status}</span></p>}
                          </div>
                          {!a.read && (
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => dismiss.mutate(a.id)} aria-label="Dismiss alert">
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="border-border/60 lg:col-span-2">
          <CardHeader className="py-3 flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-primary" /> Attendance log
            </CardTitle>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">All events</SelectItem>
                <SelectItem value="check_in">Check-in</SelectItem>
                <SelectItem value="check_out">Check-out</SelectItem>
                <SelectItem value="geofence_exit">Geofence exit</SelectItem>
                <SelectItem value="geofence_reenter">Geofence re-enter</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[480px]">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">Event</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">Agent</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">Time</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && !logs ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i} className="border-border"><TableCell colSpan={4}><Skeleton className="h-6 w-full" /></TableCell></TableRow>
                    ))
                  ) : logs && logs.length > 0 ? (
                    logs.map((log: AttendanceLogDTO) => {
                      const meta = LOG_META[log.type];
                      const Icon = meta.icon;
                      return (
                        <TableRow key={log.id} className="border-border">
                          <TableCell><span className="inline-flex items-center gap-1.5 text-xs"><Icon className={`h-3.5 w-3.5 ${meta.color}`} />{meta.label}</span></TableCell>
                          <TableCell className="text-xs"><div className="font-medium">{log.agentName}</div><div className="font-mono text-[10px] text-muted-foreground">{log.agentBadge}</div></TableCell>
                          <TableCell className="text-xs text-muted-foreground tabular">{fmtDateTime(log.createdAt)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{log.note ?? "—"}</TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow className="border-border"><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-10">No matching log entries.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
