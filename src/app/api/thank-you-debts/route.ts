import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getThankYouDebtsForMonth, monthKeyOf } from "@/lib/thankYouDebts";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.memberId) return NextResponse.json({ error: "Sem membro vinculado" }, { status: 403 });

  const month = req.nextUrl.searchParams.get("month") || monthKeyOf(new Date());
  const debts = await getThankYouDebtsForMonth(session.memberId, month);
  return NextResponse.json({ month, debts });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.memberId) return NextResponse.json({ error: "Sem membro vinculado" }, { status: 403 });

  const b = await req.json();
  const name = String(b.name || "").trim();
  const monthlyValue = Math.max(parseFloat(b.monthlyValue) || 0, 0);
  if (!name) return NextResponse.json({ error: "Informe o nome da pessoa." }, { status: 400 });
  if (monthlyValue <= 0) return NextResponse.json({ error: "Informe um valor mensal maior que zero." }, { status: 400 });

  const debt = await prisma.thankYouDebt.create({
    data: { memberId: session.memberId, name, monthlyValue },
  });
  return NextResponse.json(debt);
}
