import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { startSimulator } from "@/lib/simulator";

startSimulator();

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await db.alert.update({ where: { id }, data: { read: true } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await db.alert.update({ where: { id }, data: { read: true } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }
}
