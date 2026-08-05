import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.memberId) return NextResponse.json({ error: "Sem membro vinculado" }, { status: 403 });

  const b = await req.json();
  const weekISO = String(b.weekISO || "");
  const text = String(b.text || "").trim();
  if (!weekISO) return NextResponse.json({ error: "Semana inválida" }, { status: 400 });
  if (!text) return NextResponse.json({ error: "Escreva a atualização da semana." }, { status: 400 });

  const update = await prisma.weeklyUpdate.upsert({
    where: { memberId_weekISO: { memberId: session.memberId, weekISO } },
    create: { memberId: session.memberId, weekISO, text },
    update: { text },
  });

  return NextResponse.json(update);
}
