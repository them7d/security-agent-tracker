import { db } from "@/lib/db";
import {
  biasAwayFromCentroid,
  isPointInPolygon,
  parseGeofence,
  polygonCentroid,
  randomWalk,
} from "@/lib/geofence";

// In-memory state so we know whether the agent was inside the geofence
// on the previous tick. Keyed by agentId.
const insideState = new Map<string, boolean>();

// Whether the simulator loop is currently running.
let started = false;

/**
 * Tick one agent: nudge its GPS, detect geofence transitions, write logs/alerts.
 *
 * Behaviour:
 *  - Each tick nudges the agent by a small random walk (≤25m).
 *  - With ~10% probability per tick, the agent is biased toward walking out
 *    of its geofence so that supervisors see real exit events during a demo.
 *  - On first observed geofence exit -> write AttendanceLog(geofence_exit)
 *    + Alert(geofence_exit) + flip status to off_duty if currently on_duty.
 *  - On re-entry -> write AttendanceLog(geofence_reenter) + Alert(geofence_reenter).
 *  - The "check_in" / "check_out" attendance entries are derived from geofence
 *    transitions: first entry of the day = check_in, exit = check_out.
 */
async function tickAgent(agentId: string) {
  const agent = await db.agent.findUnique({ where: { id: agentId } });
  if (!agent) {
    insideState.delete(agentId);
    return;
  }

  const geofence = parseGeofence(agent.geofence);
  const hasGeofence = geofence.length >= 3;

  // Step the agent
  let nextLat = agent.lat;
  let nextLng = agent.lng;
  if (hasGeofence) {
    const centroid = polygonCentroid(geofence);
    const wasInside =
      insideState.get(agentId) ??
      isPointInPolygon({ lat: agent.lat, lng: agent.lng }, geofence);

    if (Math.random() < 0.1) {
      // bias outward
      const biased = biasAwayFromCentroid(
        { lat: agent.lat, lng: agent.lng },
        centroid,
        30,
      );
      nextLat = biased.lat;
      nextLng = biased.lng;
    } else {
      const step = randomWalk({ lat: agent.lat, lng: agent.lng }, 25);
      nextLat = step.lat;
      nextLng = step.lng;
    }

    const nowInside = isPointInPolygon({ lat: nextLat, lng: nextLng }, geofence);

    // Geofence transitions
    if (wasInside && !nowInside) {
      // EXIT
      await db.attendanceLog.create({
        data: {
          agentId,
          type: "geofence_exit",
          lat: nextLat,
          lng: nextLng,
          note: `Departed assigned area: ${agent.areaLabel ?? "unlabeled"}`,
        },
      });
      await db.attendanceLog.create({
        data: {
          agentId,
          type: "check_out",
          lat: nextLat,
          lng: nextLng,
          note: "Auto check-out: left geofence",
        },
      });
      await db.alert.create({
        data: {
          agentId,
          type: "geofence_exit",
          message: `${agent.name} (${agent.badgeId}) left the assigned work area${
            agent.areaLabel ? `: ${agent.areaLabel}` : ""
          }.`,
        },
      });
      if (agent.status === "on_duty" || agent.status === "patrol") {
        await db.agent.update({
          where: { id: agentId },
          data: { status: "off_duty" },
        });
      }
      insideState.set(agentId, false);
    } else if (!wasInside && nowInside) {
      // RE-ENTER
      await db.attendanceLog.create({
        data: {
          agentId,
          type: "geofence_reenter",
          lat: nextLat,
          lng: nextLng,
          note: `Re-entered assigned area: ${agent.areaLabel ?? "unlabeled"}`,
        },
      });
      await db.attendanceLog.create({
        data: {
          agentId,
          type: "check_in",
          lat: nextLat,
          lng: nextLng,
          note: "Auto check-in: entered geofence",
        },
      });
      await db.alert.create({
        data: {
          agentId,
          type: "geofence_reenter",
          message: `${agent.name} (${agent.badgeId}) re-entered the assigned work area${
            agent.areaLabel ? `: ${agent.areaLabel}` : ""
          }.`,
        },
      });
      await db.agent.update({
        where: { id: agentId },
        data: { status: "on_duty" },
      });
      insideState.set(agentId, true);
    }
  } else {
    // No geofence -> just walk
    const step = randomWalk({ lat: agent.lat, lng: agent.lng }, 25);
    nextLat = step.lat;
    nextLng = step.lng;
  }

  await db.agent.update({
    where: { id: agentId },
    data: { lat: nextLat, lng: nextLng, lastSeenAt: new Date() },
  });
}

/**
 * Start the simulator loop (idempotent). Ticks every 4 seconds.
 * Safe to call on every API request; the singleton flag prevents duplicates.
 */
export function startSimulator() {
  if (started) return;
  started = true;

  // Seed initial inside/outside state for all agents
  db.agent.findMany().then((agents) => {
    for (const a of agents) {
      const geofence = parseGeofence(a.geofence);
      const inside = isPointInPolygon({ lat: a.lat, lng: a.lng }, geofence);
      insideState.set(a.id, inside);
    }
  }).catch(() => {/* ignore */});

  setInterval(async () => {
    try {
      const agents = await db.agent.findMany({ select: { id: true } });
      await Promise.all(agents.map((a) => tickAgent(a.id)));
    } catch (err) {
      // Swallow; simulator must not crash the process
      console.error("[simulator] tick failed", err);
    }
  }, 4000);
}
