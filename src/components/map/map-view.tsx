"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
  Crosshair,
  MapPin,
  Pencil,
  Save,
  X,
  Radio,
  Users,
  CircleDot,
  LocateFixed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgents, useUpdateAgent } from "@/hooks/use-data";
import { HQ_DEFAULT } from "./map-constants";
import type { AgentDTO, LatLng } from "@/lib/types";
import { AgentDetailDrawer } from "./agent-detail-drawer";
import { toast } from "sonner";

// Leaflet is browser-only — load the map dynamically on the client
const LiveMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => (
    <Skeleton className="absolute inset-0 bg-card/60" />
  ),
});

type DrawMode = "idle" | "drawing";

export function MapView({
  focusAgentId,
  onConsumeFocus,
}: {
  focusAgentId?: string | null;
  onConsumeFocus?: () => void;
}) {
  const { data: agents = [], isLoading } = useAgents();
  const update = useUpdateAgent();

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // Geofence drawing state
  const [drawMode, setDrawMode] = React.useState<DrawMode>("idle");
  const [drawingForAgentId, setDrawingForAgentId] = React.useState<string | null>(null);
  const [draftPoints, setDraftPoints] = React.useState<LatLng[]>([]);

  const selectedAgent = React.useMemo(
    () => agents.find((a) => a.id === selectedId) ?? null,
    [agents, selectedId],
  );

  // Focus trigger from dashboard row click
  React.useEffect(() => {
    if (focusAgentId) {
      const agent = agents.find((a) => a.id === focusAgentId);
      if (agent) {
        setSelectedId(agent.id);
        setDrawerOpen(true);
        onConsumeFocus?.();
      } else if (agents.length > 0) {
        // The dashboard may pass an id that we don't yet know — clear it
        onConsumeFocus?.();
      }
    }
  }, [focusAgentId, agents, onConsumeFocus]);

  function openAgent(agent: AgentDTO) {
    setSelectedId(agent.id);
    setDrawerOpen(true);
  }

  function startDrawing(agent: AgentDTO) {
    setDrawingForAgentId(agent.id);
    setDrawMode("drawing");
    setDraftPoints([]);
    toast.info(`Click on the map to drop polygon vertices for ${agent.name}.`);
  }

  function cancelDrawing() {
    setDrawMode("idle");
    setDrawingForAgentId(null);
    setDraftPoints([]);
  }

  async function saveGeofence() {
    if (!drawingForAgentId) return;
    if (draftPoints.length < 3) {
      toast.error("Draw at least 3 vertices to form a polygon.");
      return;
    }
    try {
      await update.mutateAsync({
        id: drawingForAgentId,
        geofence: draftPoints,
      });
      toast.success("Work area saved. Agent will be monitored against this zone.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save geofence");
    } finally {
      cancelDrawing();
    }
  }

  function handleMapClick(point: LatLng) {
    if (drawMode !== "drawing") return;
    setDraftPoints((prev) => [...prev, point]);
  }

  const drawingAgent = agents.find((a) => a.id === drawingForAgentId) ?? null;
  const outsideCount = agents.filter((a) => a.geofence.length >= 3 && !a.inGeofence).length;

  return (
    <div className="space-y-3 h-full flex flex-col">
      {/* Map toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Live map · agent tracking</h1>
          <p className="text-xs text-muted-foreground">
            Real-time positions, geofence enforcement and order dispatch.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[10px] py-0.5 px-2 border-border font-mono">
            <Users className="h-3 w-3 mr-1 text-primary" />
            {agents.length} agents
          </Badge>
          <Badge
            variant="outline"
            className={`text-[10px] py-0.5 px-2 font-mono ${
              outsideCount > 0
                ? "border-red-500/40 text-red-300"
                : "border-emerald-500/40 text-emerald-300"
            }`}
          >
            <CircleDot className="h-3 w-3 mr-1" />
            {outsideCount} outside
          </Badge>

          {/* Agent picker for geofence drawing */}
          <Select
            value={drawingForAgentId ?? ""}
            onValueChange={(v) => {
              const agent = agents.find((a) => a.id === v);
              if (agent) startDrawing(agent);
            }}
            disabled={drawMode === "drawing"}
          >
            <SelectTrigger className="h-8 w-44 text-xs">
              <Pencil className="h-3.5 w-3.5 mr-1 text-primary" />
              <SelectValue placeholder="Draw work area…" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border max-h-72">
              {agents.length === 0 ? (
                <SelectItem value="__none" disabled>No agents</SelectItem>
              ) : (
                agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} · {a.badgeId}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Drawing banner */}
      {drawMode === "drawing" && drawingAgent && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-xs">
          <Pencil className="h-4 w-4 text-primary" />
          <span>
            Drawing work area for <strong>{drawingAgent.name}</strong>
            {" · "}
            <span className="font-mono text-muted-foreground">
              {draftPoints.length} {draftPoints.length === 1 ? "vertex" : "vertices"}
            </span>
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={cancelDrawing} className="h-7 text-xs">
              <X className="h-3.5 w-3.5 mr-1" /> Cancel
            </Button>
            <Button size="sm" onClick={saveGeofence} disabled={draftPoints.length < 3 || update.isPending} className="h-7 text-xs">
              <Save className="h-3.5 w-3.5 mr-1" /> Save polygon
            </Button>
          </div>
        </div>
      )}

      {/* Map canvas */}
      <div className="relative flex-1 min-h-[420px] rounded-lg overflow-hidden border border-border bg-card">
        {isLoading ? (
          <Skeleton className="absolute inset-0" />
        ) : (
          <LiveMap
            agents={agents}
            selectedId={selectedId}
            draftPoints={drawMode === "drawing" ? draftPoints : null}
            drawingAgentId={drawingForAgentId}
            onClickPoint={handleMapClick}
            onSelectAgent={openAgent}
            focusAgentId={focusAgentId}
          />
        )}

        {/* Legend */}
        <div className="absolute bottom-3 left-3 z-[1000] rounded-md border border-border bg-card/90 backdrop-blur px-3 py-2 text-[10px] font-mono space-y-1 pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30" />
            In zone
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-400 ring-2 ring-red-400/30" />
            Outside zone
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Amber polygon = assigned work area
          </div>
        </div>

        {/* Live indicator */}
        <div className="absolute top-3 right-3 z-[1000] rounded-md border border-border bg-card/90 backdrop-blur px-3 py-1.5 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <Radio className="h-3 w-3 text-primary" />
          Live · 3s refresh
        </div>
      </div>

      <AgentDetailDrawer
        agent={selectedAgent}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
