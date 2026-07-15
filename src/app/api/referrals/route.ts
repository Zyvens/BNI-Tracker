import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.memberId) return NextResponse.json({ error: "Sem membro vinculado" }, { status: 403 });

  const tipo = req.nextUrl.searchParams.get("tipo"); // dadas | recebidas
  const where =
    tipo === "dadas"
      ? { giverId: session.memberId }
      : tipo === "recebidas"
        ? { receiverId: session.memberId }
        : { OR: [{ giverId: session.memberId }, { receiverId: session.memberId }] };

  const referrals = await prisma.referral.findMany({
    where,
    include: { giver: true, receiver: true },
    orderBy: { dataISO: "desc" },
  });
  return NextResponse.json(referrals);
}

// Cria uma referência (dada ou recebida)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.memberId) return NextResponse.json({ error: "Sem membro vinculado" }, { status: 403 });

  const b = await req.json();
  if (!b.contactName || !b.dataISO) {
    return NextResponse.json({ error: "Informe o contato e a data." }, { status: 400 });
  }

  const isDada = b.direcao === "dada";

  const referral = await prisma.referral.create({
    data: {
      giverId: isDada ? session.memberId : b.giverId || null,
      giverName: isDada ? null : b.giverName || null,
      receiverId: isDada ? b.receiverId || null : session.memberId,
      receiverName: isDada ? b.receiverName || null : null,
      contactName: String(b.contactName).trim(),
      company: b.company || null,
      phone: b.phone || null,
      email: b.email || null,
      category: b.category || null,
      segment: b.segment || null,
      origem: b.origem || "referencia_direta",
      dataISO: b.dataISO,
      estimatedValue: Math.max(parseFloat(b.estimatedValue) || 0, 0),
      potential: b.potential || null,
      notes: b.notes || null,
      status: isDada ? "enviada" : "recebida",
      nextAction: b.nextAction || (isDada ? null : "Fazer o primeiro contato"),
      nextActionISO: b.nextActionISO || null,
      logs: {
        create: {
          dataISO: b.dataISO,
          tipo: "status",
          texto: isDada ? "Referência enviada." : "Referência recebida.",
          autorId: session.userId,
        },
      },
    },
    include: { giver: true, receiver: true },
  });

  // Notifica o outro lado quando ambos são membros do app
  const otherMemberId = isDada ? referral.receiverId : referral.giverId;
  if (otherMemberId) {
    const otherUser = await prisma.user.findUnique({ where: { memberId: otherMemberId } });
    if (otherUser) {
      await prisma.notification.create({
        data: {
          userId: otherUser.id,
          tipo: "info",
          title: isDada
            ? `${session.name} enviou uma referência para você`
            : `${session.name} registrou uma referência recebida de você`,
          body: `${referral.contactName}${referral.company ? ` (${referral.company})` : ""}`,
          link: `/referencias/${referral.id}`,
        },
      });
    }
  }

  return NextResponse.json(referral, { status: 201 });
}
