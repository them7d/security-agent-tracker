import { db } from "@/lib/db";
import {
  biasAwayFromCentroid, isPointInPolygon, parseGeofence,
  polygonCentroid, randomWalk,
} from "@/lib/geofence";

const insideState = new Map<string, boolean>();
let started = false;

async function tickAgent(agentId: string) {
  const agent = await db.agent.findUnique({ where: { id: agentId } });
  if (!agent) { insideState.delete(agentId); return; }

  const geofence = parseGeofence(agent.geofence);
  const hasGeofence = geofence.length >= 3;
  let nextLat = agent.lat;
  let nextLng = agent.lng;

  if (hasGeofence) {
    const centroid = polygonCentroid(geofence);
    const wasInside = insideState.get(agentId) ??
      isPointInPolygon({ lat: agent.lat, lng: agent.lng }, geofence);
    if (Math.random() < 0.1) {
      const biased = biasAwayFromCentroid({ lat: agent.lat, lng: agent.lng }, centroid, 30);
      nextLat = biased.lat; nextLng = biased.lng;
    } else {
      const step = randomWalk({ lat: agent.lat, lng: agent.lng }, 25);
      nextLat = step.lat; nextLng = step.lng;
    }
    const nowInside = isPointInPolygon({ lat: nextLat, lng: nextLng }, geofence);
    if (wasInside && !nowInside) {
      // EXIT
      await db.attendanceLog.create({ data: {
        agentId, type: "geofence_exit", lat: nextLat, lng: nextLng,
        note: `Departed assigned area: ${agent.areaLabel ?? "unlabeled"}`,
      }});
      await db.attendanceLog.create({ data: {
        agentId, type: "check_out", lat: nextLat, lng: nextLng,
        note: "Auto check-out: left geofence",
      }});
      await db.alert.create({ data: {
        agentId, type: "geofence_exit",
        message: `${agent.name} (${agent.badgeId}) left the assigned work area${agent.areaLabel ? `: ${agent.areaLabel}` : ""}.`,
      }});
      if (agent.status === "on_duty" || agent.status === "patrol") {
        await db.agent.update({ where: { id: agentId }, data: { status: "off_duty" } });
      }
      insideState.set(agentId, false);
    } else if (!wasInside && nowInside) {
      // RE-ENTER
      await db.attendanceLog.create({ data: {
        agentId, type: "geofence_reenter", lat: nextLat, lng: nextLng,
        note: `Re-entered assigned area: ${agent.areaLabel ?? "unlabeled"}`,
      }});
      await db.attendanceLog.create({ data: {
        agentId, type: "check_in", lat: nextLat, lng: nextLng,
        note: "Auto check-in: entered geofence",
      }});
      await db.alert.create({ data: {
        agentId, type: "geofence_reenter",
        message: `${agent.name} (${agent.badgeId}) re-entered the assigned work area${agent.areaLabel ? `: ${agent.areaLabel}` : ""}.`,
      }});
      await db.agent.update({ where: { id: agentId }, data: { status: "on_duty" } });
      insideState.set(agentId, true);
    }
  } else {
    const step = randomWalk({ lat: agent.lat, lng: agent.lng }, 25);
    nextLat = step.lat; nextLng = step.lng;
  }

  await db.agent.update({
    where: { id: agentId },
    data: { lat: nextLat, lng: nextLng, lastSeenAt: new Date() },
  });
}

export function startSimulator() {
  if (started) return;
  started = true;
  db.agent.findMany().then((agents) => {
    for (const a of agents) {
      const geofence = parseGeofence(a.geofence);
      const inside = isPointInPolygon({ lat: a.lat, lng: a.lng }, geofence);
      insideState.set(a.id, inside);
    }
  }).catch(() => {});
  setInterval(async () => {
    try {
      const agents = await db.agent.findMany({ select: { id: true } });
      await Promise.all(agents.map((a) => tickAgent(a.id)));
    } catch (err) {
      console.error("[simulator] tick failed", err);
    }
  }, 4000);
}
