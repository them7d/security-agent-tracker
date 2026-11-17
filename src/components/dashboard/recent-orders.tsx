"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Inbox, Send } from "lucide-react";
import { useOrders } from "@/hooks/use-data";
import { fmtDateTime } from "@/lib/format";
import type { OrderDTO } from "@/lib/types";

const PRIORITY_CLASS: Record<OrderDTO["priority"], string> = {
  low:      "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  normal:   "bg-sky-500/15 text-sky-300 border-sky-500/30",
  high:     "bg-amber-500/15 text-amber-300 border-amber-500/30",
  critical: "bg-red-500/15 text-red-300 border-red-500/30",
};
const STATUS_CLASS: Record<OrderDTO["status"], string> = {
  sent:         "text-sky-300",
  acknowledged: "text-amber-300",
  done:         "text-emerald-300",
};

export function RecentOrders() {
  const { data: orders, isLoading } = useOrders();
  return (
    <Card className="border-border/60">
      <CardHeader className="py-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Send className="h-4 w-4 text-primary" /> Recent orders
        </CardTitle>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
          {orders?.length ?? 0}
        </span>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-72">
          {isLoading && !orders ? (
            <div className="p-4 text-xs text-muted-foreground">Loading…</div>
          ) : orders && orders.length > 0 ? (
            <ul className="divide-y divide-border">
              {orders.map((o) => (
                <li key={o.id} className="px-4 py-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={`text-[9px] py-0 px-1.5 uppercase tracking-wider ${PRIORITY_CLASS[o.priority]}`}>
                      {o.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      <span className={STATUS_CLASS[o.status]}>●</span> {o.status}
                    </span>
                    <span className="ml-auto text-[10px] text-muted-foreground tabular">
                      {fmtDateTime(o.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-foreground line-clamp-2">{o.body}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    To: <span className="font-mono">{o.agentBadge ?? o.agentId}</span> · {o.agentName}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 flex flex-col items-center gap-2 text-center">
              <Inbox className="h-6 w-6 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                No orders dispatched yet. Open the Live Map to send one.
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
