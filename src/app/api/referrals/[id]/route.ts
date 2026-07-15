import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const PIPELINE = [
  "enviada", "recebida", "contato_pendente", "contato_realizado", "reuniao_marcada",
  "diagnostico", "proposta_enviada", "negociacao", "fechada", "perdida",
  "parceria", "sem_perfil", "duplicada",
];

async function notify(memberId: string | null, data: { tipo: string; title: string; body?: string; link?: string }) {
  if (!memberId) return;
  const user = await prisma.user.findUnique({ where: { memberId } });
  if (user) await prisma.notification.create({ data: { userId: user.id, ...data } });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.memberId) return NextResponse.json({ error: "Sem membro vinculado" }, { status: 403 });
  const r = await prisma.referral.findUnique({
    where: { id: params.id },
    include: { giver: true, receiver: true, logs: { orderBy: { createdAt: "desc" } } },
  });
  if (!r || (r.giverId !== session.memberId && r.receiverId !== session.memberId)) {
    return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  }
  return NextResponse.json(r);
}

// Atualizações e transições do ciclo (status, declaração e confirmação de valor)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.memberId) return NextResponse.json({ error: "Sem membro vinculado" }, { status: 403 });

  const r = await prisma.referral.findUnique({ where: { id: params.id }, include: { giver: true, receiver: true } });
  if (!r || (r.giverId !== session.memberId && r.receiverId !== session.memberId)) {
    return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  }

  const b = await req.json();
  const isGiver = r.giverId === session.memberId;
  const isReceiver = r.receiverId === session.memberId;
  const todayISO = new Date().toISOString().slice(0, 10);
  const logs: { dataISO: string; tipo: string; texto: string; autorId: string }[] = [];
  const data: Record<string, unknown> = {};

  switch (b.action) {
    case "update": {
      for (const k of ["company", "phone", "email", "category", "segment", "origem", "potential", "notes", "nextAction", "nextActionISO", "lostReason", "dealType"]) {
        if (b[k] !== undefined) data[k] = b[k] || null;
      }
      if (b.estimatedValue !== undefined) data.estimatedValue = Math.max(parseFloat(b.estimatedValue) || 0, 0);
      break;
    }
    case "status": {
      if (!PIPELINE.includes(b.status)) return NextResponse.json({ error: "Status inválido" }, { status: 400 });
      data.status = b.status;
      if (b.status === "contato_realizado" && !r.firstContactISO) data.firstContactISO = todayISO;
      if (b.status === "fechada") {
        data.closedISO = todayISO;
        // fechou: beneficiado precisa declarar o valor
        if (r.confirmationStatus === "nao_aplicavel") data.confirmationStatus = "aguardando_declaracao";
      }
      if (b.status === "perdida" && b.lostReason) data.lostReason = b.lostReason;
      logs.push({ dataISO: todayISO, tipo: "status", texto: `Status alterado para "${b.status.replace(/_/g, " ")}".`, autorId: session.userId });
      if (b.status === "fechada") {
        await notify(isReceiver ? r.giverId : r.receiverId, {
          tipo: "info",
          title: `Negócio fechado: ${r.contactName}`,
          body: `A referência avançou para "fechada".`,
          link: `/referencias/${r.id}`,
        });
      }
      break;
    }
    case "log": {
      if (!b.texto) return NextResponse.json({ error: "Texto obrigatório" }, { status: 400 });
      logs.push({ dataISO: b.dataISO || todayISO, tipo: b.tipo || "nota", texto: String(b.texto), autorId: session.userId });
      break;
    }
    case "declarar": {
      // Beneficiado declara o valor efetivamente recebido
      if (!isReceiver) return NextResponse.json({ error: "Apenas o beneficiado declara o valor." }, { status: 403 });
      const valor = Math.max(parseFloat(b.valor) || 0, 0);
      data.declaredValue = valor;
      data.declaredISO = todayISO;
      data.receivedISO = b.receivedISO || null;
      data.dealType = b.dealType || null;
      data.inOfficialSystem = !!b.inOfficialSystem;
      data.heardInMeeting = !!b.heardInMeeting;
      data.confirmationStatus = "valor_declarado";
      if (r.status !== "fechada") { data.status = "fechada"; data.closedISO = todayISO; }
      logs.push({ dataISO: todayISO, tipo: "valor", texto: `Valor declarado: R$ ${valor.toLocaleString("pt-BR")}.`, autorId: session.userId });
      await notify(r.giverId, {
        tipo: "confirmacao",
        title: `${r.receiver?.name ?? "Membro"} declarou R$ ${valor.toLocaleString("pt-BR")} proveniente da sua referência`,
        body: `${r.contactName}${r.company ? ` (${r.company})` : ""} — confirme ou conteste o valor.`,
        link: `/referencias/${r.id}`,
      });
      break;
    }
    case "confirmar": {
      // Gerador confirma o valor declarado
      if (!isGiver) return NextResponse.json({ error: "Apenas o gerador confirma o valor." }, { status: 403 });
      data.confirmationStatus = "confirmada";
      data.confirmedValue = r.declaredValue;
      data.confirmedISO = todayISO;
      if (b.heardInMeeting !== undefined) data.heardInMeeting = !!b.heardInMeeting;
      if (b.inOfficialSystem !== undefined) data.inOfficialSystem = !!b.inOfficialSystem;
      logs.push({ dataISO: todayISO, tipo: "valor", texto: "Valor confirmado pelo gerador.", autorId: session.userId });
      await notify(r.receiverId, {
        tipo: "confirmacao",
        title: `${r.giver?.name ?? "Membro"} confirmou o valor declarado`,
        body: `${r.contactName} — R$ ${(r.declaredValue ?? 0).toLocaleString("pt-BR")}.`,
        link: `/referencias/${r.id}`,
      });
      break;
    }
    case "contestar": {
      if (!isGiver) return NextResponse.json({ error: "Apenas o gerador contesta o valor." }, { status: 403 });
      data.confirmationStatus = "contestada";
      logs.push({ dataISO: todayISO, tipo: "valor", texto: `Valor contestado${b.motivo ? `: ${b.motivo}` : "."}`, autorId: session.userId });
      await notify(r.receiverId, {
        tipo: "alerta",
        title: `${r.giver?.name ?? "Membro"} contestou o valor declarado`,
        body: b.motivo || `Revise o valor de ${r.contactName}.`,
        link: `/referencias/${r.id}`,
      });
      break;
    }
    case "corrigir": {
      // Beneficiado corrige valor após contestação
      if (!isReceiver) return NextResponse.json({ error: "Apenas o beneficiado corrige o valor." }, { status: 403 });
      const valor = Math.max(parseFloat(b.valor) || 0, 0);
      data.declaredValue = valor;
      data.declaredISO = todayISO;
      data.confirmationStatus = "valor_declarado";
      logs.push({ dataISO: todayISO, tipo: "valor", texto: `Valor corrigido para R$ ${valor.toLocaleString("pt-BR")}.`, autorId: session.userId });
      await notify(r.giverId, {
        tipo: "confirmacao",
        title: `${r.receiver?.name ?? "Membro"} corrigiu o valor declarado`,
        body: `${r.contactName} — novo valor: R$ ${valor.toLocaleString("pt-BR")}.`,
        link: `/referencias/${r.id}`,
      });
      break;
    }
    default:
      return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  }

  const updated = await prisma.referral.update({
    where: { id: r.id },
    data: {
      ...data,
      ...(logs.length > 0 ? { logs: { create: logs } } : {}),
    },
    include: { giver: true, receiver: true, logs: { orderBy: { createdAt: "desc" } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.memberId) return NextResponse.json({ error: "Sem membro vinculado" }, { status: 403 });
  const r = await prisma.referral.findUnique({ where: { id: params.id } });
  if (!r || (r.giverId !== session.memberId && r.receiverId !== session.memberId)) {
    return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  }
  await prisma.referral.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
