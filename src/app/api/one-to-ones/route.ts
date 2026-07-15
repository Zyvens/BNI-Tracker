import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session?.memberId) return NextResponse.json({ error: "Sem membro vinculado" }, { status: 403 });
  const items = await prisma.oneToOne.findMany({
    where: { memberId: session.memberId },
    include: { with: true },
    orderBy: { dataISO: "desc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.memberId) return NextResponse.json({ error: "Sem membro vinculado" }, { status: 403 });

  const b = await req.json();
  if (!b.dataISO || (!b.withMemberId && !b.withName)) {
    return NextResponse.json({ error: "Informe a data e com quem foi a reunião." }, { status: 400 });
  }

  const item = await prisma.oneToOne.create({
    data: {
      memberId: session.memberId,
      withMemberId: b.withMemberId || null,
      withName: b.withMemberId ? null : String(b.withName).trim(),
      dataISO: b.dataISO,
      local: b.local || null,
      duracao: b.duracao || null,
      notes: b.notes || null,
    },
    include: { with: true },
  });

  return NextResponse.json(item, { status: 201 });
}
