"use client";

import * as React from "react";
import { Loader2, Trash2, MoreHorizontal, Radio, MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgents, useDeleteAgent } from "@/hooks/use-data";
import { timeAgo, fmtCoords } from "@/lib/format";
import type { AgentDTO, AgentStatus } from "@/lib/types";

const STATUS_VARIANT: Record<
  AgentStatus,
  { label: string; className: string }
> = {
  on_duty:  { label: "On duty",  className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  patrol:   { label: "Patrol",    className: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
  off_duty: { label: "Off duty",  className: "bg-red-500/15 text-red-300 border-red-500/30" },
};

export function AgentsTable({ onSelectAgent }: { onSelectAgent?: (a: AgentDTO) => void }) {
  const { data: agents, isLoading } = useAgents();
  const del = useDeleteAgent();
  const [pendingDelete, setPendingDelete] = React.useState<AgentDTO | null>(null);

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await del.mutateAsync(pendingDelete.id);
      toast.success(`Removed ${pendingDelete.name} (${pendingDelete.badgeId})`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete agent");
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold tracking-tight">Agents roster</h2>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
          {agents?.length ?? 0} on roster · live
        </span>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Agent
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Badge
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Work area
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Position
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Last seen
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && !agents ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell colSpan={7}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : agents && agents.length > 0 ? (
              agents.map((a) => {
                const st = STATUS_VARIANT[a.status];
                const hasGeofence = a.geofence.length >= 3;
                const outside = hasGeofence && !a.inGeofence;
                return (
                  <TableRow
                    key={a.id}
                    className="border-border cursor-pointer hover:bg-accent/40"
                    onClick={() => onSelectAgent?.(a)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/15 ring-1 ring-primary/30 flex items-center justify-center text-[10px] font-semibold text-primary">
                          {initials(a.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{a.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {a.phone ?? "—"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{a.badgeId}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium border ${st.className}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {st.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      {hasGeofence ? (
                        <span className="text-xs flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-primary" />
                          {a.areaLabel ?? "Unlabeled"}
                          {outside && (
                            <Badge variant="outline" className="ml-1 text-[9px] py-0 px-1 border-red-500/40 text-red-300">
                              OUT
                            </Badge>
                          )}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Not assigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground tabular">
                      {fmtCoords(a.lat, a.lng)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {timeAgo(a.lastSeenAt)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border">
                          <DropdownMenuItem onSelect={() => onSelectAgent?.(a)}>
                            <Radio className="h-3.5 w-3.5 mr-2" /> View on map
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() => setPendingDelete(a)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete agent
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow className="border-border">
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-10">
                  No agents on the roster yet. Use “Add agent” to create one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent className="bg-popover border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pendingDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the agent, their order history, attendance logs
              and alerts. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {del.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
