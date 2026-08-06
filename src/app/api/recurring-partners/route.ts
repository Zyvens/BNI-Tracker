import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Parceiros recorrentes: contatos externos (fora da equipe) que mandam
// indicação com frequência mensal. Casados por nome com Referral.giverName.
export async function GET() {
  const session = await getSession();
  if (!session?.memberId) return NextResponse.json({ error: "Sem membro vinculado" }, { status: 403 });

  const partners = await prisma.recurringPartner.findMany({
    where: { memberId: session.memberId },
    orderBy: { createdAt: "desc" },
  });

  const refs = await prisma.referral.findMany({
    where: { receiverId: session.memberId, giverId: null, giverName: { not: null } },
    select: { giverName: true, status: true, estimatedValue: true, declaredValue: true, confirmedValue: true },
  });

  const byName = new Map<string, { count: number; fechadas: number; valor: number }>();
  for (const r of refs) {
    const key = (r.giverName ?? "").trim().toLowerCase();
    if (!key) continue;
    const agg = byName.get(key) ?? { count: 0, fechadas: 0, valor: 0 };
    agg.count++;
    if (r.status === "fechada") {
      agg.fechadas++;
      agg.valor += r.confirmedValue ?? r.declaredValue ?? r.estimatedValue;
    }
    byName.set(key, agg);
  }

  const result = partners.map((p) => ({
    ...p,
    stats: byName.get(p.name.trim().toLowerCase()) ?? { count: 0, fechadas: 0, valor: 0 },
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.memberId) return NextResponse.json({ error: "Sem membro vinculado" }, { status: 403 });

  const b = await req.json();
  const name = String(b.name || "").trim();
  if (!name) return NextResponse.json({ error: "Informe o nome do parceiro." }, { status: 400 });

  const partner = await prisma.recurringPartner.upsert({
    where: { memberId_name: { memberId: session.memberId, name } },
    create: {
      memberId: session.memberId,
      name,
      company: b.company || null,
      phone: b.phone || null,
      notes: b.notes || null,
    },
    update: {
      active: true,
      company: b.company || null,
      phone: b.phone || null,
      notes: b.notes || null,
    },
  });

  return NextResponse.json(partner);
}
