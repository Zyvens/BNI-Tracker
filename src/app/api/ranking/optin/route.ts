import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.memberId) return NextResponse.json({ error: "Sem membro vinculado" }, { status: 403 });

  const b = await req.json();
  const member = await prisma.member.update({
    where: { id: session.memberId },
    data: { showInRanking: !!b.enabled },
  });

  return NextResponse.json({ showInRanking: member.showInRanking });
}
