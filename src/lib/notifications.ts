import { prisma } from "@/lib/prisma";
import { MemberSnapshot, daysSince } from "@/lib/snapshot";
import { sendPushToUser } from "@/lib/push";

type Draft = {
  tipo: "info" | "alerta" | "critico" | "confirmacao";
  title: string;
  body?: string;
  link?: string;
  dedupeKey: string;
};

// Gera notificações inteligentes a partir do snapshot do membro.
// Idempotente: usa dedupeKey (uma por assunto por mês) para não repetir alertas.
export async function generateNotifications(userId: string, snap: MemberSnapshot) {
  const period = new Date().toISOString().slice(0, 7); // yyyy-mm
  const drafts: Draft[] = [];

  for (const a of snap.actions) {
    if (a.urgency === "critical") {
      drafts.push({
        tipo: "critico",
        title: `${a.kpi.label} abaixo da meta`,
        body: a.actionMessage,
        link: "/rumo-100",
        dedupeKey: `critical:${a.kpi.id}:${period}`,
      });
    } else if (a.urgency === "urgent") {
      drafts.push({
        tipo: "alerta",
        title: `Em ${a.daysUntilDrop} dias ${a.kpi.label} pode ficar abaixo da meta`,
        body: a.actionMessage,
        link: "/rumo-100",
        dedupeKey: `urgent:${a.kpi.id}:${period}`,
      });
    }
  }

  if (snap.pendencias.confirmar > 0) {
    drafts.push({
      tipo: "confirmacao",
      title: `${snap.pendencias.confirmar} negócio(s) aguardando sua confirmação de valor`,
      body: "Membros beneficiados declararam valores provenientes das suas referências.",
      link: "/referencias?aba=dadas",
      dedupeKey: `confirmar:${period}:${snap.pendencias.confirmar}`,
    });
  }

  if (snap.pendencias.declarar > 0) {
    drafts.push({
      tipo: "confirmacao",
      title: `${snap.pendencias.declarar} negócio(s) fechado(s) sem declaração de valor`,
      body: "Declare o valor recebido para que o gerador da referência possa confirmar.",
      link: "/referencias?aba=recebidas",
      dedupeKey: `declarar:${period}:${snap.pendencias.declarar}`,
    });
  }

  for (const r of snap.refsReceived) {
    if (["recebida", "contato_pendente"].includes(r.status) && daysSince(r.dataISO) >= 5) {
      drafts.push({
        tipo: "alerta",
        title: `Referência de ${r.giver?.name ?? r.giverName ?? "membro"} sem contato há ${daysSince(r.dataISO)} dias`,
        body: `${r.contactName}${r.company ? ` (${r.company})` : ""} aguarda o primeiro contato.`,
        link: `/referencias/${r.id}`,
        dedupeKey: `parada:${r.id}`,
      });
    }
  }

  const noUegThisMonth = !snap.entries.some(
    (e) => e.dateISO.startsWith(period) && e.ueg
  );
  if (noUegThisMonth && new Date().getDate() >= 15) {
    drafts.push({
      tipo: "info",
      title: "Você ainda não registrou nenhuma UEG neste mês",
      body: "Participe do UEG da próxima reunião para manter o indicador saudável.",
      link: "/registro-semana",
      dedupeKey: `ueg:${period}`,
    });
  }

  // Lembrete mensal para agradecer parceiros recorrentes (indicadores externos frequentes)
  if (snap.member) {
    const partners = await prisma.recurringPartner.findMany({
      where: { memberId: snap.member.id, active: true },
    });
    for (const partner of partners) {
      drafts.push({
        tipo: "info",
        title: `Agradeça ${partner.name} pelas indicações`,
        body: `${partner.name} é um parceiro recorrente. Um agradecimento mantém a relação forte.`,
        link: "/parceiros",
        dedupeKey: `thank-partner:${partner.id}:${period}`,
      });
    }
  }

  if (snap.outlook.marginPoints >= 0 && snap.outlook.marginPoints < snap.goals.safetyMargin) {
    drafts.push({
      tipo: "info",
      title: "Meta atingida, mas com pouca margem de segurança",
      body: `Você está ${snap.outlook.marginPoints} ponto(s) acima da meta. Veja em Rumo aos 100 como criar margem.`,
      link: "/rumo-100",
      dedupeKey: `margem:${period}`,
    });
  }

  if (drafts.length === 0) return;

  const existing = await prisma.notification.findMany({
    where: { userId, dedupeKey: { in: drafts.map((d) => d.dedupeKey) } },
    select: { dedupeKey: true },
  });
  const seen = new Set(existing.map((e) => e.dedupeKey));
  const fresh = drafts.filter((d) => !seen.has(d.dedupeKey));

  if (fresh.length > 0) {
    await prisma.notification.createMany({
      data: fresh.map((d) => ({ userId, ...d })),
    });

    const push =
      fresh.length === 1
        ? { title: fresh[0].title, body: fresh[0].body, url: fresh[0].link }
        : { title: `${fresh.length} novas notificações no BNI Tracker`, body: fresh[0].title, url: "/notificacoes" };
    await sendPushToUser(userId, push).catch(() => {});
  }
}
