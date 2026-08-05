import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.memberId) return NextResponse.json({ error: "Sem membro vinculado" }, { status: 403 });

  const b = await req.json();
  const toId = String(b.toId || "");
  if (!toId) return NextResponse.json({ error: "Contato inválido" }, { status: 400 });
  if (toId === session.memberId) return NextResponse.json({ error: "Contato inválido" }, { status: 400 });

  const target = await prisma.member.findUnique({ where: { id: toId } });
  if (!target) return NextResponse.json({ error: "Membro não encontrado" }, { status: 404 });

  const fromId = b.direction === "received" ? toId : session.memberId;
  const realToId = b.direction === "received" ? session.memberId : toId;

  const testimonial = await prisma.testimonial.create({
    data: {
      fromId,
      toId: realToId,
      dataISO: b.dataISO || new Date().toISOString().slice(0, 10),
      notes: b.notes || null,
    },
  });

  return NextResponse.json(testimonial);
}
