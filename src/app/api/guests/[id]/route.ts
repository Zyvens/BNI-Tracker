import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.memberId) return NextResponse.json({ error: "Sem membro vinculado" }, { status: 403 });
  const g = await prisma.guest.findUnique({ where: { id: params.id } });
  if (!g || g.memberId !== session.memberId) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const b = await req.json();
  const data: Record<string, unknown> = {};
  for (const k of ["name", "company", "category", "phone", "email", "meetingISO", "receivedBy", "notes"]) {
    if (b[k] !== undefined) data[k] = b[k] || null;
  }
  for (const k of ["confirmed", "attended", "interested", "becameMember"]) {
    if (b[k] !== undefined) data[k] = !!b[k];
  }

  const guest = await prisma.guest.update({ where: { id: params.id }, data });
  return NextResponse.json(guest);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.memberId) return NextResponse.json({ error: "Sem membro vinculado" }, { status: 403 });
  const g = await prisma.guest.findUnique({ where: { id: params.id } });
  if (!g || g.memberId !== session.memberId) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }
  await prisma.guest.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
