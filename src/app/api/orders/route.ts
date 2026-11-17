import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeOrder } from "@/lib/serializers";
import { startSimulator } from "@/lib/simulator";

startSimulator();

/**
 * GET /api/orders?agentId=...
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const agentId = url.searchParams.get("agentId");
  const limit = Number(url.searchParams.get("limit") ?? 50);

  const orders = await db.order.findMany({
    where: agentId ? { agentId } : undefined,
    include: { agent: { select: { name: true, badgeId: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return NextResponse.json(orders.map(serializeOrder));
}

/**
 * POST /api/orders
 * Body: { agentId, body, priority? }
 */
export async function POST(req: Request) {
  const payload = await req.json().catch(() => null);
  if (!payload) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { agentId, body, priority } = payload as {
    agentId?: string;
    body?: string;
    priority?: string;
  };

  if (!agentId || !body?.trim()) {
    return NextResponse.json(
      { error: "Missing agentId or body" },
      { status: 400 },
    );
  }

  const validPriority = ["low", "normal", "high", "critical"].includes(priority ?? "")
    ? priority!
    : "normal";

  const order = await db.order.create({
    data: {
      agentId,
      body: body.trim(),
      priority: validPriority,
      status: "sent",
    },
    include: { agent: { select: { name: true, badgeId: true } } },
  });

  return NextResponse.json(serializeOrder(order), { status: 201 });
}
