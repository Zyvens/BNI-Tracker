import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Pipeline privado "Criando uma possibilidade" — estritamente escopado ao próprio
// membro. Nunca cruzar com Referral/giver/receiver de outro membro.
export async function GET() {
  const session = await getSession();
  if (!session?.memberId) return NextResponse.json({ error: "Sem membro vinculado" }, { status: 403 });

  const possibilities = await prisma.possibility.findMany({
    where: { memberId: session.memberId },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(possibilities);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.memberId) return NextResponse.json({ error: "Sem membro vinculado" }, { status: 403 });

  const b = await req.json();
  const contactName = String(b.contactName || "").trim();
  if (!contactName) return NextResponse.json({ error: "Informe o nome do contato." }, { status: 400 });

  const possibility = await prisma.possibility.create({
    data: {
      memberId: session.memberId,
      contactName,
      company: b.company || null,
      notes: b.notes || null,
      status: b.status || "explorando",
    },
  });
  return NextResponse.json(possibility);
}
