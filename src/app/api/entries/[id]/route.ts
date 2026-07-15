import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.memberId) return NextResponse.json({ error: "Sem membro vinculado" }, { status: 403 });
  const entry = await prisma.weekEntry.findUnique({ where: { id: params.id } });
  if (!entry || entry.memberId !== session.memberId) {
    return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });
  }
  await prisma.weekEntry.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
