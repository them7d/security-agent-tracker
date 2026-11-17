"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MapPin, Phone, Radio, Send, ScrollText, Activity } from "lucide-react";
import type { AgentDTO, OrderDTO } from "@/lib/types";
import { fmtCoords, fmtDateTime, timeAgo } from "@/lib/format";
import { useOrders } from "@/hooks/use-data";
import { SendOrderForm } from "./send-order-form";

const STATUS_LABEL: Record<AgentDTO["status"], { label: string; className: string }> = {
  on_duty:  { label: "On duty",  className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  patrol:   { label: "Patrol",    className: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
  off_duty: { label: "Off duty",  className: "bg-red-500/15 text-red-300 border-red-500/30" },
};

const ORDER_STATUS_COLOR: Record<OrderDTO["status"], string> = {
  sent:         "text-sky-300",
  acknowledged: "text-amber-300",
  done:         "text-emerald-300",
};

export function AgentDetailDrawer({
  agent,
  open,
  onOpenChange,
}: {
  agent: AgentDTO | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { data: orders = [] } = useOrders(agent?.id);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-card border-border p-0 flex flex-col"
      >
        {agent && (
          <>
            <SheetHeader className="px-4 py-3 border-b border-border space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md bg-primary/15 ring-1 ring-primary/40 flex items-center justify-center text-sm font-semibold text-primary">
                  {agent.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <div className="min-w-0">
                  <SheetTitle className="text-base truncate">{agent.name}</SheetTitle>
                  <SheetDescription className="text-xs font-mono">
                    Badge {agent.badgeId}
                  </SheetDescription>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge
                  variant="outline"
                  className={`text-[10px] py-0 px-1.5 uppercase tracking-wider ${STATUS_LABEL[agent.status].className}`}
                >
                  {STATUS_LABEL[agent.status].label}
                </Badge>
                {agent.geofence.length >= 3 && !agent.inGeofence && (
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-red-500/40 text-red-300 uppercase tracking-wider">
                    Out of zone
                  </Badge>
                )}
                {agent.geofence.length >= 3 && agent.inGeofence && (
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-emerald-500/40 text-emerald-300 uppercase tracking-wider">
                    In zone
                  </Badge>
                )}
              </div>
            </SheetHeader>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {/* Position */}
                <section className="space-y-2">
                  <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-primary" /> Live position
                  </h3>
                  <div className="rounded-md bg-secondary/40 p-3 font-mono text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Latitude</span>
                      <span className="tabular">{agent.lat.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Longitude</span>
                      <span className="tabular">{agent.lng.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last ping</span>
                      <span>{timeAgo(agent.lastSeenAt)}</span>
                    </div>
                  </div>
                  {agent.phone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" /> {agent.phone}
                    </div>
                  )}
                </section>

                <Separator />

                {/* Send order */}
                <section className="space-y-2">
                  <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Send className="h-3 w-3 text-primary" /> Dispatch order
                  </h3>
                  <SendOrderForm agentId={agent.id} />
                </section>

                <Separator />

                {/* Orders log */}
                <section className="space-y-2">
                  <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <ScrollText className="h-3 w-3 text-primary" /> Order history
                  </h3>
                  {orders.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      No orders dispatched yet.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {orders.slice(0, 8).map((o) => (
                        <li key={o.id} className="rounded-md border border-border/70 p-2.5">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-[9px] py-0 px-1.5 uppercase tracking-wider border-border">
                              {o.priority}
                            </Badge>
                            <span className={`text-[10px] uppercase tracking-wider ${ORDER_STATUS_COLOR[o.status]}`}>
                              ● {o.status}
                            </span>
                            <span className="ml-auto text-[10px] text-muted-foreground tabular">
                              {fmtDateTime(o.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs">{o.body}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <Separator />

                {/* Geofence status */}
                <section className="space-y-2">
                  <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Activity className="h-3 w-3 text-primary" /> Assigned zone
                  </h3>
                  {agent.geofence.length >= 3 ? (
                    <div className="rounded-md bg-secondary/40 p-3 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Area</span>
                        <span>{agent.areaLabel ?? "Unlabeled"}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Vertices</span>
                        <span className="tabular font-mono">{agent.geofence.length}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Current state</span>
                        <span className={agent.inGeofence ? "text-emerald-300" : "text-red-300"}>
                          {agent.inGeofence ? "Inside" : "Outside"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      No geofence assigned. Switch to “Draw work area” on the map to define one.
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    Coords: {fmtCoords(agent.lat, agent.lng, 6)}
                  </p>
                </section>
              </div>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
