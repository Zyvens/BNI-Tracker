import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Lista simples de membros ativos (para selects de referência/1-a-1)
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const members = await prisma.member.findMany({
    where: { active: true },
    select: { id: true, name: true, company: true, category: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(members);
}
