import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeAgent } from "@/lib/serializers";
import type { LatLng } from "@/lib/types";

interface Params { params: Promise<{ id: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    await db.agent.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  const data: Record<string, unknown> = {};
  if (typeof body.status === "string") data.status = body.status;
  if (typeof body.areaLabel === "string") data.areaLabel = body.areaLabel;
  if (typeof body.name === "string") data.name = body.name;
  if (typeof body.phone === "string") data.phone = body.phone;
  if (typeof body.lat === "number") data.lat = body.lat;
  if (typeof body.lng === "number") data.lng = body.lng;
  if (Array.isArray(body.geofence)) {
    const cleaned: LatLng[] = body.geofence.filter(
      (p: unknown): p is LatLng =>
        typeof p === "object" && p !== null &&
        typeof (p as LatLng).lat === "number" &&
        typeof (p as LatLng).lng === "number",
    );
    data.geofence = JSON.stringify(cleaned);
  }
  try {
    const agent = await db.agent.update({ where: { id }, data });
    return NextResponse.json(serializeAgent(agent));
  } catch {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }
}
