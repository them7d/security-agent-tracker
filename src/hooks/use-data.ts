"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  AgentDTO,
  AgentStatus,
  AlertDTO,
  AttendanceLogDTO,
  LatLng,
  OrderDTO,
  OrderPriority,
} from "@/lib/types";

/* ============================================================
 * Agents
 * ============================================================ */
export function useAgents() {
  return useQuery<AgentDTO[]>({
    queryKey: ["agents"],
    queryFn: async () => {
      const res = await fetch("/api/agents", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load agents");
      return res.json();
    },
    // Poll every 3 seconds for live GPS positions
    refetchInterval: 3000,
  });
}

export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      badgeId: string;
      phone?: string;
      lat: number;
      lng: number;
      areaLabel?: string;
      geofence?: LatLng[];
    }) => {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error ?? "Failed to create agent");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents"] }),
  });
}

export function useDeleteAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/agents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete agent");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agents"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["logs"] });
      qc.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

export function useUpdateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string;
      geofence?: LatLng[];
      areaLabel?: string;
      status?: AgentStatus;
      name?: string;
      phone?: string;
    }) => {
      const res = await fetch(`/api/agents/${payload.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update agent");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents"] }),
  });
}

/* ============================================================
 * Orders
 * ============================================================ */
export function useOrders(agentId?: string) {
  return useQuery<OrderDTO[]>({
    queryKey: ["orders", agentId ?? "all"],
    queryFn: async () => {
      const qs = agentId ? `?agentId=${agentId}&limit=20` : "?limit=20";
      const res = await fetch(`/api/orders${qs}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load orders");
      return res.json();
    },
    refetchInterval: 8000,
  });
}

export function useSendOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      agentId: string;
      body: string;
      priority: OrderPriority;
    }) => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to send order");
      return res.json();
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["orders", vars.agentId] });
      qc.invalidateQueries({ queryKey: ["orders", "all"] });
    },
  });
}

/* ============================================================
 * Logs
 * ============================================================ */
export function useLogs(filters?: { type?: string; agentId?: string }) {
  return useQuery<AttendanceLogDTO[]>({
    queryKey: ["logs", filters?.type ?? "all", filters?.agentId ?? "all"],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.type) params.set("type", filters.type);
      if (filters?.agentId) params.set("agentId", filters.agentId);
      params.set("limit", "100");
      const res = await fetch(`/api/logs?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load logs");
      return res.json();
    },
    refetchInterval: 5000,
  });
}

/* ============================================================
 * Alerts
 * ============================================================ */
export function useAlerts(onlyUnread = false) {
  return useQuery<AlertDTO[]>({
    queryKey: ["alerts", onlyUnread ? "unread" : "all"],
    queryFn: async () => {
      const res = await fetch(
        `/api/alerts?${onlyUnread ? "unread=true" : ""}&limit=50`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error("Failed to load alerts");
      return res.json();
    },
    refetchInterval: 4000,
  });
}

export function useDismissAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/alerts/${id}/read`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to dismiss alert");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

/* ============================================================
 * Seed
 * ============================================================ */
export function useSeed() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/seed", { method: "POST" });
      if (!res.ok) throw new Error("Failed to seed");
      return res.json();
    },
  });
}

/* ============================================================
 * Current agent (for agent-role sessions)
 * ============================================================ */
export function useCurrentAgent() {
  return useQuery<AgentDTO>({
    queryKey: ["agent-me"],
    queryFn: async () => {
      const res = await fetch("/api/agents/me", { cache: "no-store" });
      if (!res.ok) throw new Error("Not authenticated as agent");
      return res.json();
    },
    refetchInterval: 4000,
  });
}

/* ============================================================
 * Acknowledge / mark-done an order
 * ============================================================ */
export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; status: "acknowledged" | "done" }) => {
      const res = await fetch(`/api/orders/${payload.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: payload.status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error ?? "Failed to update order");
      }
      return res.json();
    },
    onSuccess: (_data, _vars) => {
      // Invalidate the per-agent list and the "all" list
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
