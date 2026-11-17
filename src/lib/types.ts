// Shared domain types for SentinelSec agent tracking platform

export type AgentStatus = "on_duty" | "off_duty" | "patrol";
export type OrderPriority = "low" | "normal" | "high" | "critical";
export type OrderStatus = "sent" | "acknowledged" | "done";
export type AttendanceLogType =
  | "check_in"
  | "check_out"
  | "geofence_exit"
  | "geofence_reenter"
  | "manual";
export type AlertType = "geofence_exit" | "geofence_reenter" | "offline" | "custom";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface AgentDTO {
  id: string;
  badgeId: string;
  name: string;
  phone: string | null;
  status: AgentStatus;
  lat: number;
  lng: number;
  lastSeenAt: string;
  geofence: LatLng[];
  areaLabel: string | null;
  createdAt: string;
  updatedAt: string;
  inGeofence: boolean;
}

export interface OrderDTO {
  id: string;
  agentId: string;
  agentName?: string;
  agentBadge?: string;
  body: string;
  priority: OrderPriority;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceLogDTO {
  id: string;
  agentId: string;
  agentName?: string;
  agentBadge?: string;
  type: AttendanceLogType;
  lat: number | null;
  lng: number | null;
  note: string | null;
  createdAt: string;
}

export interface AlertDTO {
  id: string;
  agentId: string;
  agentName?: string;
  agentBadge?: string;
  type: AlertType;
  message: string;
  read: boolean;
  createdAt: string;
}
