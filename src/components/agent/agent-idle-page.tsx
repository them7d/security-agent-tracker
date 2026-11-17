"use client";

import * as React from "react";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";
import { ShieldCheck, LogOut, MapPin, Radio, Clock, Bell, Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useCurrentAgent, useOrders } from "@/hooks/use-data";
import { OrderCard } from "./order-card";
import { fmtCoords, timeAgo } from "@/lib/format";
import type { OrderDTO } from "@/lib/types";

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  on_duty:  { label: "On duty",  className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  patrol:   { label: "Patrol",    className: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
  off_duty: { label: "Off duty",  className: "bg-red-500/15 text-red-300 border-red-500/30" },
};

export function AgentIdlePage() {
  const { data: session } = useSession();
  const agentId = session?.user?.agentId;

  const { data: agent, isLoading: agentLoading } = useCurrentAgent();
  const { data: orders = [], isLoading: ordersLoading } = useOrders(agentId);

  // Track seen order IDs to detect new arrivals
  const seenOrderIdsRef = React.useRef<Set<string>>(new Set());
  const firstLoadRef = React.useRef(true);

  // Browser Notification permission prompt
  React.useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      // Don't prompt on first paint — wait for a user gesture
      // (browsers block permission prompts without one).
      // The agent will see in-app toasts regardless.
    }
  }, []);

  // Detect new orders and fire notifications
  React.useEffect(() => {
    if (!orders || orders.length === 0) {
      // Still track that we've loaded
      firstLoadRef.current = false;
      return;
    }

    const seen = seenOrderIdsRef.current;
    const newOrders: OrderDTO[] = [];

    for (const o of orders) {
      if (!seen.has(o.id)) {
        if (!firstLoadRef.current && o.status === "sent") {
          newOrders.push(o);
        }
        seen.add(o.id);
      }
    }
    firstLoadRef.current = false;

    if (newOrders.length > 0) {
      for (const o of newOrders) {
        // In-app toast — always fires
        toast.info(
          `New order from supervisor (${o.priority.toUpperCase()})`,
          { description: o.body, duration: 8000 },
        );
        // Browser notification — only if permission already granted
        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          try {
            new Notification("New order received", { body: o.body });
          } catch {
            /* ignore */
          }
        }
      }
    }
  }, [orders]);

  const newCount = orders.filter((o) => o.status === "sent").length;
  const acknowledgedCount = orders.filter((o) => o.status === "acknowledged").length;

  const status = agent ? STATUS_LABEL[agent.status] : null;
  const hasGeofence = agent && agent.geofence.length >= 3;
  const outside = agent && hasGeofence && !agent.inGeofence;

  async function enableBrowserNotifications() {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      const result = await Notification.requestPermission();
      if (result === "granted") {
        toast.success("Browser notifications enabled");
        new Notification("Notifications on", {
          body: "You will be alerted when new orders arrive.",
        });
      } else {
        toast.info("Browser notifications blocked — in-app alerts still work");
      }
    } else if (Notification.permission === "granted") {
      toast.info("Browser notifications already enabled");
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Compact top bar */}
      <header className="h-14 shrink-0 border-b border-border bg-sidebar/80 backdrop-blur flex items-center gap-3 px-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary/15 ring-1 ring-primary/40 flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">SentinelSec</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Agent console
            </div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs"
            onClick={enableBrowserNotifications}
          >
            <Bell className="h-3.5 w-3.5 mr-1.5" /> Enable alerts
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs text-destructive hover:text-destructive"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="h-3.5 w-3.5 mr-1.5" /> End shift
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {/* Agent header card */}
          {agentLoading && !agent ? (
            <Skeleton className="h-32 w-full" />
          ) : agent ? (
            <Card className="border-border/60 overflow-hidden">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-md bg-primary/15 ring-1 ring-primary/40 flex items-center justify-center text-lg font-semibold text-primary">
                    {agent.name
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-lg font-semibold tracking-tight truncate">
                      {agent.name}
                    </h1>
                    <p className="text-xs text-muted-foreground font-mono">
                      Badge {agent.badgeId}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {status && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] py-0 px-1.5 uppercase tracking-wider ${status.className}`}
                        >
                          {status.label}
                        </Badge>
                      )}
                      {hasGeofence && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] py-0 px-1.5 uppercase tracking-wider ${
                            outside
                              ? "bg-red-500/15 text-red-300 border-red-500/40"
                              : "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                          }`}
                        >
                          {outside ? "Outside zone" : "In zone"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Live position + assigned area */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-primary" /> Live position
                    </p>
                    <p className="font-mono tabular text-sm">
                      {fmtCoords(agent.lat, agent.lng, 6)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Updated {timeAgo(agent.lastSeenAt)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Radio className="h-3 w-3 text-primary" /> Assigned area
                    </p>
                    <p className="text-sm">
                      {agent.areaLabel ?? "Unlabeled"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {hasGeofence
                        ? `${agent.geofence.length} vertices defining your zone`
                        : "No geofence assigned yet"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* New orders banner (if any) */}
          {newCount > 0 && (
            <div className="rounded-md border border-primary/60 bg-primary/10 px-4 py-3 flex items-center gap-3 animate-pulse">
              <Bell className="h-5 w-5 text-primary" />
              <div className="text-sm">
                <strong>{newCount}</strong> new {newCount === 1 ? "order" : "orders"} awaiting your acknowledgment
              </div>
            </div>
          )}

          {/* Orders list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold tracking-tight flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Shift orders
              </h2>
              <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                <span className="text-primary">{newCount} new</span>
                <span>{acknowledgedCount} active</span>
                <span>{orders.length} total</span>
              </div>
            </div>

            {ordersLoading && orders.length === 0 ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : orders.length === 0 ? (
              <Card className="border-dashed border-border/60">
                <CardContent className="p-8 flex flex-col items-center gap-2 text-center">
                  <Inbox className="h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No orders yet. Your console will alert you the moment a supervisor
                    dispatches one.
                  </p>
                  <p className="text-[10px] text-muted-foreground italic">
                    Keep this page open while on shift.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[calc(100vh-22rem)]">
                <div className="space-y-3 pr-2">
                  {orders.map((o) => (
                    <OrderCard
                      key={o.id}
                      order={o}
                      isNew={o.status === "sent"}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
