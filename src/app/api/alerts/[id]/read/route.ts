import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { startSimulator } from "@/lib/simulator";

startSimulator();

/**
 * POST /api/alerts/:id/read
 * Marks a single alert as read.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await db.alert.update({ where: { id }, data: { read: true } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }
}

/**
 * DELETE /api/alerts/:id/read  (semantically: dismiss)
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await db.alert.update({ where: { id }, data: { read: true } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }
}
