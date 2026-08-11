import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.memberId) return NextResponse.json({ error: "Sem membro vinculado" }, { status: 403 });

  const debt = await prisma.thankYouDebt.findUnique({ where: { id: params.id } });
  if (!debt || debt.memberId !== session.memberId) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const b = await req.json();
  if (b.action === "toggle-month") {
    const monthKey = String(b.monthKey || "");
    if (!monthKey) return NextResponse.json({ error: "Mês inválido" }, { status: 400 });
    const existing = await prisma.thankYouDebtMonth.findUnique({
      where: { debtId_monthKey: { debtId: debt.id, monthKey } },
    });
    const thanked = !(existing?.thanked ?? false);
    const updated = await prisma.thankYouDebtMonth.upsert({
      where: { debtId_monthKey: { debtId: debt.id, monthKey } },
      create: { debtId: debt.id, monthKey, thanked, thankedAt: thanked ? new Date() : null },
      update: { thanked, thankedAt: thanked ? new Date() : null },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.memberId) return NextResponse.json({ error: "Sem membro vinculado" }, { status: 403 });

  const debt = await prisma.thankYouDebt.findUnique({ where: { id: params.id } });
  if (!debt || debt.memberId !== session.memberId) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await prisma.thankYouDebt.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
