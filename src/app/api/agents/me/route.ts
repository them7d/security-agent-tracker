import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { serializeAgent } from "@/lib/serializers";
import { startSimulator } from "@/lib/simulator";

startSimulator();

/**
 * GET /api/agents/me
 * Returns the agent associated with the current session (role === "agent").
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "agent" || !session.user.agentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const agent = await db.agent.findUnique({
    where: { id: session.user.agentId },
  });
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }
  return NextResponse.json(serializeAgent(agent));
}
