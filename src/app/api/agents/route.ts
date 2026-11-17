import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { startSimulator } from "@/lib/simulator";
import { serializeAgent } from "@/lib/serializers";
import type { LatLng } from "@/lib/types";

startSimulator();

export async function GET() {
  const agents = await db.agent.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(agents.map(serializeAgent));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  const { name, badgeId, phone, lat, lng, areaLabel, geofence } = body as {
    name?: string; badgeId?: string; phone?: string;
    lat?: number; lng?: number; areaLabel?: string; geofence?: LatLng[];
  };
  if (!name || !badgeId || typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json(
      { error: "Missing required fields: name, badgeId, lat, lng" },
      { status: 400 },
    );
  }
  const existing = await db.agent.findUnique({ where: { badgeId } });
  if (existing) {
    return NextResponse.json({ error: `Badge ID ${badgeId} already exists` }, { status: 409 });
  }
  const pin = badgeId.replace(/\D/g, "").slice(-4).padStart(4, "0");
  const agent = await db.agent.create({
    data: {
      name: name.trim(), badgeId: badgeId.trim(),
      phone: phone?.trim() || null, pin,
      lat, lng, areaLabel: areaLabel?.trim() || null,
      geofence: JSON.stringify(geofence ?? []),
      status: "on_duty",
    },
  });
  return NextResponse.json(serializeAgent(agent), { status: 201 });
}
