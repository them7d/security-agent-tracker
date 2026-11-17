import type { Agent, AttendanceLog, Alert, Order } from "@prisma/client";
import { isPointInPolygon, parseGeofence } from "./geofence";
import type {
  AgentDTO,
  AlertDTO,
  AttendanceLogDTO,
  LatLng,
  OrderDTO,
} from "./types";

export function serializeAgent(agent: Agent): AgentDTO {
  const geofence = parseGeofence(agent.geofence);
  const inGeofence = isPointInPolygon(
    { lat: agent.lat, lng: agent.lng },
    geofence,
  );
  return {
    id: agent.id,
    badgeId: agent.badgeId,
    name: agent.name,
    phone: agent.phone,
    status: agent.status as AgentDTO["status"],
    lat: agent.lat,
    lng: agent.lng,
    lastSeenAt: agent.lastSeenAt.toISOString(),
    geofence,
    areaLabel: agent.areaLabel,
    createdAt: agent.createdAt.toISOString(),
    updatedAt: agent.updatedAt.toISOString(),
    inGeofence,
  };
}

export function serializeOrder(
  order: Order & { agent?: { name: string; badgeId: string } | null },
): OrderDTO {
  return {
    id: order.id,
    agentId: order.agentId,
    agentName: order.agent?.name,
    agentBadge: order.agent?.badgeId,
    body: order.body,
    priority: order.priority as OrderDTO["priority"],
    status: order.status as OrderDTO["status"],
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export function serializeLog(
  log: AttendanceLog & { agent?: { name: string; badgeId: string } | null },
): AttendanceLogDTO {
  return {
    id: log.id,
    agentId: log.agentId,
    agentName: log.agent?.name,
    agentBadge: log.agent?.badgeId,
    type: log.type as AttendanceLogDTO["type"],
    lat: log.lat,
    lng: log.lng,
    note: log.note,
    createdAt: log.createdAt.toISOString(),
  };
}

export function serializeAlert(
  alert: Alert & { agent?: { name: string; badgeId: string } | null },
): AlertDTO {
  return {
    id: alert.id,
    agentId: alert.agentId,
    agentName: alert.agent?.name,
    agentBadge: alert.agent?.badgeId,
    type: alert.type as AlertDTO["type"],
    message: alert.message,
    read: alert.read,
    createdAt: alert.createdAt.toISOString(),
  };
}
