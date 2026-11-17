import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { serializeOrder } from "@/lib/serializers";
import { startSimulator } from "@/lib/simulator";

startSimulator();

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body || !["acknowledged", "done"].includes(body.status)) {
    return NextResponse.json(
      { error: "Invalid status; expected 'acknowledged' or 'done'" },
      { status: 400 },
    );
  }
  if (session.user.role === "agent") {
    const order = await db.order.findUnique({ where: { id } });
    if (!order || order.agentId !== session.user.agentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  try {
    const updated = await db.order.update({
      where: { id },
      data: { status: body.status },
      include: { agent: { select: { name: true, badgeId: true } } },
    });
    return NextResponse.json(serializeOrder(updated));
  } catch {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
}
