import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.memberId) return NextResponse.json({ error: "Sem membro vinculado" }, { status: 403 });

  const p = await prisma.recurringPartner.findUnique({ where: { id: params.id } });
  if (!p || p.memberId !== session.memberId) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const b = await req.json();
  const data: Record<string, unknown> = {};
  if (b.action === "thanked") data.lastThankedAt = new Date();
  if (b.action === "toggle") data.active = !p.active;
  if (b.action === "update") {
    for (const k of ["company", "phone", "notes"]) if (b[k] !== undefined) data[k] = b[k] || null;
  }

  const updated = await prisma.recurringPartner.update({ where: { id: p.id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.memberId) return NextResponse.json({ error: "Sem membro vinculado" }, { status: 403 });

  const p = await prisma.recurringPartner.findUnique({ where: { id: params.id } });
  if (!p || p.memberId !== session.memberId) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await prisma.recurringPartner.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
