import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeLog } from "@/lib/serializers";
import { startSimulator } from "@/lib/simulator";

startSimulator();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const agentId = url.searchParams.get("agentId");
  const limit = Number(url.searchParams.get("limit") ?? 100);
  const logs = await db.attendanceLog.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(agentId ? { agentId } : {}),
    },
    include: { agent: { select: { name: true, badgeId: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return NextResponse.json(logs.map(serializeLog));
}
