"use client";

import { Loader2, CheckCircle2, BellRing } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUpdateOrderStatus } from "@/hooks/use-data";
import { fmtDateTime, timeAgo } from "@/lib/format";
import type { OrderDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRIORITY_CLASS: Record<OrderDTO["priority"], string> = {
  low:      "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  normal:   "bg-sky-500/15 text-sky-300 border-sky-500/30",
  high:     "bg-amber-500/15 text-amber-300 border-amber-500/30",
  critical: "bg-red-500/15 text-red-300 border-red-500/30",
};

const STATUS_LABEL: Record<OrderDTO["status"], { label: string; color: string }> = {
  sent:         { label: "New · awaiting ack",    color: "text-sky-300"    },
  acknowledged: { label: "Acknowledged · in progress", color: "text-amber-300" },
  done:         { label: "Completed",             color: "text-emerald-300" },
};

export function OrderCard({
  order,
  isNew,
}: {
  order: OrderDTO;
  isNew?: boolean;
}) {
  const update = useUpdateOrderStatus();
  const status = STATUS_LABEL[order.status];

  async function ack() {
    try {
      await update.mutateAsync({ id: order.id, status: "acknowledged" });
      toast.success("Order acknowledged");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to acknowledge");
    }
  }

  async function done() {
    try {
      await update.mutateAsync({ id: order.id, status: "done" });
      toast.success("Order marked complete");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to mark done");
    }
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 transition-colors",
        isNew
          ? "border-primary/60 ring-2 ring-primary/30 shadow-lg shadow-primary/10"
          : "border-border",
      )}
    >
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {order.status === "sent" && (
          <Badge
            variant="outline"
            className="text-[10px] py-0 px-1.5 uppercase tracking-wider bg-primary/15 text-primary border-primary/40"
          >
            <BellRing className="h-3 w-3 mr-1" /> New
          </Badge>
        )}
        <Badge
          variant="outline"
          className={`text-[10px] py-0 px-1.5 uppercase tracking-wider ${PRIORITY_CLASS[order.priority]}`}
        >
          {order.priority}
        </Badge>
        <span className={cn("text-[10px] uppercase tracking-wider", status.color)}>
          ● {status.label}
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground tabular">
          {fmtDateTime(order.createdAt)} · {timeAgo(order.createdAt)}
        </span>
      </div>

      <p className="text-sm text-foreground leading-relaxed">{order.body}</p>

      <div className="mt-3 flex items-center gap-2">
        {order.status === "sent" && (
          <Button size="sm" onClick={ack} disabled={update.isPending}>
            {update.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            Acknowledge
          </Button>
        )}
        {order.status === "acknowledged" && (
          <Button size="sm" variant="secondary" onClick={done} disabled={update.isPending}>
            {update.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Mark complete
          </Button>
        )}
        {order.status === "done" && (
          <span className="text-[10px] text-muted-foreground italic">
            Completed · no further action
          </span>
        )}
      </div>
    </div>
  );
}
