import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeAlert } from "@/lib/serializers";
import { startSimulator } from "@/lib/simulator";

startSimulator();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const onlyUnread = url.searchParams.get("unread") === "true";
  const limit = Number(url.searchParams.get("limit") ?? 50);
  const alerts = await db.alert.findMany({
    where: onlyUnread ? { read: false } : {},
    include: { agent: { select: { name: true, badgeId: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return NextResponse.json(alerts.map(serializeAlert));
}
