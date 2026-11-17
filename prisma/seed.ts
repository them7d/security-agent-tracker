// Standalone Prisma seed script.
// Run with: bun run db:seed
// Idempotent: creates the demo supervisor + 4 demo agents only if they don't exist.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const HQ = { lat: 33.3152, lng: 44.3661 };

function squareAround(center: { lat: number; lng: number }, halfSizeMeters = 80) {
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

function metersToLatLng(ref: { lat: number; lng: number }, offset: { lat: number; lng: number }) {
  const metersToDegLat = 1 / 111320;
  const metersToDegLng = 1 / (111320 * Math.cos((ref.lat * Math.PI) / 180));
  return {
    lat: ref.lat + offset.lat * metersToDegLat,
    lng: ref.lng + offset.lng * metersToDegLng,
  };
}

const SEED_AGENTS = [
  { name: "Karim Haddad", badgeId: "SC-0142", phone: "+964 770 112 4451", areaLabel: "Karkh gate",        offset: { lat:  60, lng:   0 } },
  { name: "Layla Saleh",  badgeId: "SC-0143", phone: "+964 770 223 8810", areaLabel: "Rusafa market",     offset: { lat: -40, lng: 120 } },
  { name: "Omar Najib",   badgeId: "SC-0144", phone: "+964 770 334 1290", areaLabel: "Mutanabbi Street",  offset: { lat:  20, lng: -90 } },
  { name: "Dina Farouk",  badgeId: "SC-0145", phone: "+964 770 445 7723", areaLabel: "Tahrir square",     offset: { lat: -90, lng:  40 } },
] as const;

async function main() {
  const email = "supervisor@sentinel.sec";
  let supervisor = await db.supervisor.findUnique({ where: { email } });
  if (!supervisor) {
    const passwordHash = await bcrypt.hash("Sentinel#2025", 10);
    supervisor = await db.supervisor.create({
      data: { email, name: "Operations Supervisor", passwordHash },
    });
    console.log(`✓ Created supervisor: ${supervisor.email}`);
  } else {
    console.log(`• Supervisor already exists: ${supervisor.email}`);
  }

  const created: string[] = [];
  for (const def of SEED_AGENTS) {
    const pin = def.badgeId.replace(/\D/g, "").slice(-4).padStart(4, "0");
    const existing = await db.agent.findUnique({ where: { badgeId: def.badgeId } });
    if (existing) {
      if (!existing.pin || existing.pin === "0000" || existing.pin !== pin) {
        await db.agent.update({ where: { id: existing.id }, data: { pin } });
        console.log(`• Updated agent ${def.badgeId} pin → ${pin}`);
      } else {
        console.log(`• Agent already exists: ${def.badgeId} (${def.name})`);
      }
      continue;
    }
    const start = metersToLatLng(HQ, def.offset);
    const geofence = squareAround(start, 80);
    const agent = await db.agent.create({
      data: {
        name: def.name, badgeId: def.badgeId, phone: def.phone, pin,
        lat: start.lat, lng: start.lng,
        areaLabel: def.areaLabel,
        geofence: JSON.stringify(geofence),
        status: "on_duty",
      },
    });
    await db.attendanceLog.create({
      data: {
        agentId: agent.id, type: "check_in",
        lat: start.lat, lng: start.lng,
        note: `Initial shift start at ${def.areaLabel}`,
      },
    });
    created.push(agent.badgeId);
    console.log(`✓ Created agent ${def.badgeId} (${def.name}) · pin ${pin}`);
  }

  console.log("");
  console.log("==========================================================");
  console.log("SentinelSec seed complete");
  console.log(`Supervisor: ${supervisor.email} / Sentinel#2025`);
  console.log(`Agents: SC-0142→0142, SC-0143→0143, SC-0144→0144, SC-0145→0145`);
  console.log("==========================================================");
}

main()
  .catch((e) => { console.error("Seed failed:", e); process.exit(1); })
  .finally(() => db.$disconnect());
