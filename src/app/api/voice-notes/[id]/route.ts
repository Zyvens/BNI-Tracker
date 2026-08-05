import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.memberId) return NextResponse.json({ error: "Sem membro vinculado" }, { status: 403 });

  const n = await prisma.voiceNote.findUnique({ where: { id: params.id } });
  if (!n || n.memberId !== session.memberId) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await prisma.voiceNote.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
