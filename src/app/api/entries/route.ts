import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session?.memberId) return NextResponse.json({ error: "Sem membro vinculado" }, { status: 403 });
  const entries = await prisma.weekEntry.findMany({
    where: { memberId: session.memberId },
    orderBy: { dateISO: "desc" },
  });
  return NextResponse.json(entries);
}

// Cria/atualiza o registro da semana (upsert por data da reunião)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.memberId) return NextResponse.json({ error: "Sem membro vinculado" }, { status: 403 });

  const b = await req.json();
  if (!b.dateISO || !/^\d{4}-\d{2}-\d{2}$/.test(b.dateISO)) {
    return NextResponse.json({ error: "Data da reunião inválida." }, { status: 400 });
  }

  const data = {
    presenca: b.presenca === "Aus" || b.presenca === "Subs" ? b.presenca : "P",
    atrasado: !!b.atrasado,
    ueg: !!b.ueg,
    testemunho: !!b.testemunho,
    rdi: Math.max(parseInt(b.rdi) || 0, 0),
    rde: Math.max(parseInt(b.rde) || 0, 0),
    rri: Math.max(parseInt(b.rri) || 0, 0),
    rre: Math.max(parseInt(b.rre) || 0, 0),
    convidados: Math.max(parseInt(b.convidados) || 0, 0),
    reunioes1a1: Math.max(parseInt(b.reunioes1a1) || 0, 0),
    onf: Math.max(parseFloat(b.onf) || 0, 0),
    observacoes: b.observacoes || null,
  };

  const entry = await prisma.weekEntry.upsert({
    where: { memberId_dateISO: { memberId: session.memberId, dateISO: b.dateISO } },
    create: { memberId: session.memberId, dateISO: b.dateISO, ...data },
    update: data,
  });

  return NextResponse.json(entry, { status: 201 });
}
