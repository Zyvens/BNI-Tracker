import { cache } from "react";
import { prisma } from "@/lib/prisma";
import {
  buildKpis,
  DEFAULT_GOALS,
  Goals,
  KpiId,
  KpiValues,
  emptyValues,
  monthKey,
  computeScore,
  computeProjection,
  computeStatusCard,
  computeOutlook,
  kpiStatus,
  dashboardStatus,
  kpiPoints,
  kpiDica,
  MonthlyProduction,
} from "@/lib/engine";

export async function getGoals(): Promise<Goals> {
  const s = await prisma.settings.findFirst();
  if (!s) return DEFAULT_GOALS;
  return {
    refDadas: s.goalRefs,
    convidados: s.goalConvidados,
    reunioes1a1: s.goal1a1,
    uegs: s.goalUegs,
    testemunhos: s.goalTestemunhos,
    opnf: s.goalOpnf,
    targetScore: s.targetScore,
    safetyMargin: s.safetyMargin,
  };
}

// Janela móvel de 6 meses terminando no mês atual
export function currentWindow(today = new Date()) {
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
  const start = new Date(today.getFullYear(), today.getMonth() - 5, 1);
  const fmt = (d: Date) =>
    d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" }).replace(".", "");
  return { start, end, label: `${fmt(start)} – ${fmt(end)}` };
}

function inRange(iso: string, start: Date, end: Date) {
  const d = new Date(iso + "T00:00:00");
  return d >= start && d <= end;
}

export type MemberSnapshot = Awaited<ReturnType<typeof getMemberSnapshot>>;

export async function getMemberSnapshot(memberId: string) {
  const today = new Date();
  const win = currentWindow(today);
  const goals = await getGoals();
  const KPIS = buildKpis(goals);

  const [member, entries, records, refsGiven, refsReceived, oneToOnes, reportCount, overrides] =
    await Promise.all([
      prisma.member.findUnique({ where: { id: memberId } }),
      prisma.weekEntry.findMany({ where: { memberId }, orderBy: { dateISO: "asc" } }),
      prisma.performanceRecord.findMany({
        where: { memberId },
        include: { report: true },
        orderBy: [{ report: { year: "asc" } }, { report: { month: "asc" } }],
      }),
      prisma.referral.findMany({
        where: { giverId: memberId },
        include: { receiver: true },
        orderBy: { dataISO: "desc" },
      }),
      prisma.referral.findMany({
        where: { receiverId: memberId },
        include: { giver: true },
        orderBy: { dataISO: "desc" },
      }),
      prisma.oneToOne.findMany({ where: { memberId }, include: { with: true }, orderBy: { dataISO: "desc" } }),
      prisma.report.count(),
      prisma.kpiOverride.findMany({ where: { memberId } }),
    ]);

  // ---- Valores oficiais (último relatório importado) ----
  const latest = records.length > 0 ? records[records.length - 1] : null;
  const official: KpiValues | null = latest
    ? {
        convidados: latest.visitors,
        refDadas: latest.referralsGiven,
        uegs: latest.ceu,
        reunioes1a1: latest.oneToOnes,
        testemunhos: latest.testimonials,
        opnf: latest.tyfcb,
      }
    : null;

  // ---- Soma dos registros semanais dentro da janela ----
  const winEntries = entries.filter((e) => inRange(e.dateISO, win.start, win.end));
  const weekly = emptyValues();
  let ausencias = 0;
  let atrasos = 0;
  let presencas = 0;
  let substituicoes = 0;
  for (const e of winEntries) {
    weekly.refDadas += e.rdi + e.rde;
    weekly.convidados += e.convidados;
    weekly.reunioes1a1 += e.reunioes1a1;
    weekly.opnf += e.onf;
    weekly.uegs += e.ueg ? 1 : 0;
    weekly.testemunhos += e.testemunho ? 1 : 0;
    if (e.presenca === "Aus") ausencias++;
    else if (e.presenca === "Subs") substituicoes++;
    else presencas++;
    if (e.atrasado) atrasos++;
  }

  if (latest) {
    ausencias = Math.max(ausencias, latest.absences);
    atrasos = Math.max(atrasos, latest.late);
    presencas = Math.max(presencas, latest.presences);
    substituicoes = Math.max(substituicoes, latest.substitutions);
  }

  // Total de reuniões: maior entre o que o membro já registrou manualmente
  // e o total apurado no relatório oficial (presenças + ausências + substituições).
  const totalReunioes = Math.max(
    winEntries.length,
    latest ? latest.presences + latest.absences + latest.substitutions : 0
  );

  // ---- Valores atuais: maior entre oficial, registrado e ajuste rápido ----
  const overrideMap = new Map(overrides.map((o) => [o.kpiId, o.value]));
  const current = emptyValues();
  for (const k of Object.keys(current) as KpiId[]) {
    current[k] = Math.max(official ? official[k] : 0, weekly[k], overrideMap.get(k) ?? 0);
  }

  // ---- Produção mensal p/ projeção de caducidade ----
  const production: MonthlyProduction = new Map();
  for (const e of entries) {
    const d = new Date(e.dateISO + "T00:00:00");
    const key = monthKey(d);
    const p = production.get(key) ?? emptyValues();
    p.refDadas += e.rdi + e.rde;
    p.convidados += e.convidados;
    p.reunioes1a1 += e.reunioes1a1;
    p.opnf += e.onf;
    p.uegs += e.ueg ? 1 : 0;
    p.testemunhos += e.testemunho ? 1 : 0;
    production.set(key, p);
  }
  for (let i = 1; i < records.length; i++) {
    const prev = records[i - 1];
    const cur = records[i];
    const key = `${cur.report.year}-${String(cur.report.month).padStart(2, "0")}`;
    if (production.has(key)) continue;
    production.set(key, {
      convidados: Math.max(cur.visitors - prev.visitors, 0),
      refDadas: Math.max(cur.referralsGiven - prev.referralsGiven, 0),
      uegs: Math.max(cur.ceu - prev.ceu, 0),
      reunioes1a1: Math.max(cur.oneToOnes - prev.oneToOnes, 0),
      testemunhos: Math.max(cur.testimonials - prev.testimonials, 0),
      opnf: Math.max(cur.tyfcb - prev.tyfcb, 0),
    });
  }

  const { months, actions } = computeProjection(production, current, goals, today, ausencias, atrasos);
  const statusCard = computeStatusCard(actions);
  const score = computeScore(current, ausencias, atrasos, goals);
  const outlook = computeOutlook(score, months, goals, today);

  const kpis = KPIS.map((kpi) => {
    const v = current[kpi.id];
    const pts = kpiPoints(kpi.id, v, goals);
    return {
      ...kpi,
      current: v,
      status: kpiStatus(v, kpi.goal),
      statusDash: dashboardStatus(v, kpi.goal),
      points: pts.points,
      maxPoints: pts.maxPoints,
      pct: Math.min(Math.round((v / kpi.goal) * 100), 100),
      dica: kpiDica(kpi.id, v, kpi.goal, kpi.isCurrency),
    };
  });

  // ---- Análise das referências recebidas (card do dashboard) ----
  const refValor = (r: (typeof refsReceived)[number]) =>
    r.confirmedValue ?? r.declaredValue ?? r.estimatedValue;
  const recConvertidas = refsReceived.filter((r) => r.status === "fechada");
  const recAndamento = refsReceived.filter(
    (r) => !["fechada", "perdida", "sem_perfil", "duplicada", "recebida", "contato_pendente"].includes(r.status)
  );
  const recPendentes = refsReceived.filter((r) => ["recebida", "contato_pendente"].includes(r.status));
  const recPerdidas = refsReceived.filter((r) => ["perdida", "sem_perfil", "duplicada"].includes(r.status));
  const refsRecebidasAnalise = {
    total: refsReceived.length,
    convertidas: recConvertidas.length,
    emAndamento: recAndamento.length,
    pendentes: recPendentes.length,
    perdidas: recPerdidas.length,
    valorConvertido: recConvertidas.reduce((s, r) => s + refValor(r), 0),
    valorEmAndamento: recAndamento.reduce((s, r) => s + refValor(r), 0),
  };

  // ---- Pendências de confirmação (base compartilhada) ----
  // Como beneficiado: negócios fechados que ainda não declarei
  const toDeclare = refsReceived.filter(
    (r) => r.status === "fechada" && r.confirmationStatus === "aguardando_declaracao"
  );
  // Como gerador: valores declarados aguardando minha confirmação
  const toConfirm = refsGiven.filter((r) => r.confirmationStatus === "valor_declarado");
  // Referências dadas sem retorno do beneficiado
  const semRetorno = refsGiven.filter(
    (r) => !["fechada", "perdida", "sem_perfil", "duplicada"].includes(r.status) &&
      daysSince(r.dataISO, today) > 14
  );
  // Referências recebidas paradas (sem contato há 5+ dias)
  const paradas = refsReceived.filter(
    (r) => ["recebida", "contato_pendente"].includes(r.status) && daysSince(r.dataISO, today) >= 5
  );

  return {
    member,
    goals,
    window: { start: win.start.toISOString(), end: win.end.toISOString(), label: win.label },
    official,
    weekly,
    current,
    ausencias,
    atrasos,
    presencas,
    substituicoes,
    totalReunioes,
    score,
    outlook,
    kpis,
    months,
    actions,
    statusCard,
    hasSixMonths: reportCount >= 6 || production.size >= 6,
    entries,
    refsGiven,
    refsReceived,
    refsRecebidasAnalise,
    oneToOnes,
    pendencias: {
      declarar: toDeclare.length,
      confirmar: toConfirm.length,
      semRetorno: semRetorno.length,
      paradas: paradas.length,
    },
    latestReport: latest
      ? { month: latest.report.month, year: latest.report.year, totalPoints: latest.totalPoints }
      : null,
  };
}

export function daysSince(iso: string, today = new Date()): number {
  return Math.floor((today.getTime() - new Date(iso + "T00:00:00").getTime()) / 86400000);
}

// Deduplica o cálculo do snapshot dentro da mesma requisição (layout + página)
export const getMemberSnapshotCached = cache(getMemberSnapshot);
