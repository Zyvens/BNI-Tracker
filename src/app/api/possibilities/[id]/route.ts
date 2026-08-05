import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.memberId) return NextResponse.json({ error: "Sem membro vinculado" }, { status: 403 });

  const p = await prisma.possibility.findUnique({ where: { id: params.id } });
  if (!p || p.memberId !== session.memberId) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const b = await req.json();
  const data: Record<string, unknown> = {};
  for (const k of ["contactName", "company", "notes", "status"]) {
    if (b[k] !== undefined) data[k] = b[k] || null;
  }

  const updated = await prisma.possibility.update({ where: { id: p.id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.memberId) return NextResponse.json({ error: "Sem membro vinculado" }, { status: 403 });

  const p = await prisma.possibility.findUnique({ where: { id: params.id } });
  if (!p || p.memberId !== session.memberId) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await prisma.possibility.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
