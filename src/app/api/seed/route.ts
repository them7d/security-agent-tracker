import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { startSimulator } from "@/lib/simulator";
import type { LatLng } from "@/lib/types";

startSimulator();

// Reference downtown — Baghdad (Iraq). Agents are seeded in a ~500m radius.
// Each gets a small rectangular geofence polygon centred on their start position.
const HQ: LatLng = { lat: 33.3152, lng: 44.3661 };

function squareAround(center: LatLng, halfSizeMeters = 80): LatLng[] {
  const metersToDegLat = 1 / 111320;
  const metersToDegLng = 1 / (111320 * Math.cos((center.lat * Math.PI) / 180));
  const dLat = halfSizeMeters * metersToDegLat;
  const dLng = halfSizeMeters * metersToDegLng;
  return [
    { lat: center.lat - dLat, lng: center.lng - dLng },
    { lat: center.lat - dLat, lng: center.lng + dLng },
    { lat: center.lat + dLat, lng: center.lng + dLng },
    { lat: center.lat + dLat, lng: center.lng - dLng },
  ];
}

const SEED_AGENTS: Array<{
  name: string;
  badgeId: string;
  phone: string;
  areaLabel: string;
  offset: LatLng; // offset from HQ in meters
}> = [
  { name: "Karim Haddad",     badgeId: "SC-0142", phone: "+964 770 112 4451", areaLabel: "Karkh gate",         offset: { lat:  60, lng:   0 } },
  { name: "Layla Saleh",      badgeId: "SC-0143", phone: "+964 770 223 8810", areaLabel: "Rusafa market",      offset: { lat: -40, lng: 120 } },
  { name: "Omar Najib",       badgeId: "SC-0144", phone: "+964 770 334 1290", areaLabel: "Mutanabbi Street",   offset: { lat:  20, lng: -90 } },
  { name: "Dina Farouk",      badgeId: "SC-0145", phone: "+964 770 445 7723", areaLabel: "Tahrir square",      offset: { lat: -90, lng:  40 } },
];

function metersToLatLng(ref: LatLng, offsetMeters: LatLng): LatLng {
  const metersToDegLat = 1 / 111320;
  const metersToDegLng = 1 / (111320 * Math.cos((ref.lat * Math.PI) / 180));
  return {
    lat: ref.lat + offsetMeters.lat * metersToDegLat,
    lng: ref.lng + offsetMeters.lng * metersToDegLng,
  };
}

/**
 * POST /api/seed
 * Idempotent: creates the supervisor + demo agents if missing.
 */
export async function POST() {
  // Supervisor
  const email = "supervisor@sentinel.sec";
  let supervisor = await db.supervisor.findUnique({ where: { email } });
  if (!supervisor) {
    const passwordHash = await bcrypt.hash("Sentinel#2025", 10);
    supervisor = await db.supervisor.create({
      data: { email, name: "Operations Supervisor", passwordHash },
    });
  }

  // Agents
  const created: string[] = [];
  for (const def of SEED_AGENTS) {
    const existing = await db.agent.findUnique({ where: { badgeId: def.badgeId } });
    if (existing) continue;

    const start = metersToLatLng(HQ, def.offset);
    const geofence = squareAround(start, 80);
    const agent = await db.agent.create({
      data: {
        name: def.name,
        badgeId: def.badgeId,
        phone: def.phone,
        lat: start.lat,
        lng: start.lng,
        areaLabel: def.areaLabel,
        geofence: JSON.stringify(geofence),
        status: "on_duty",
      },
    });

    await db.attendanceLog.create({
      data: {
        agentId: agent.id,
        type: "check_in",
        lat: start.lat,
        lng: start.lng,
        note: `Initial shift start at ${def.areaLabel}`,
      },
    });
    created.push(agent.badgeId);
  }

  return NextResponse.json({
    supervisorEmail: supervisor.email,
    supervisorPassword: "Sentinel#2025",
    seededAgents: created,
    mapCenter: HQ,
  });
}
