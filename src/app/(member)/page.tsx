import { getSession } from "@/lib/auth";
import { getMemberSnapshotCached } from "@/lib/snapshot";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = (await getSession())!;
  const snap = await getMemberSnapshotCached(session.memberId!);
  const unread = await prisma.notification.count({
    where: { userId: session.userId, readAt: null },
  });

  const shortLabel = (id: string) => snap.kpis.find((k) => k.id === id)?.shortLabel ?? id;

  type DashboardKpi = {
    id: string;
    label: string;
    goal: number;
    current: number;
    status: "green" | "yellow" | "red";
    points: number;
    maxPoints: number;
    pct: number;
    isCurrency: boolean;
    subtitle: string;
    editable: boolean;
    inverse: boolean;
    noScore?: boolean;
    statusLabel?: string;
  };

  const kpiCards: DashboardKpi[] = snap.kpis.map((k) => ({
    id: k.id,
    label: k.label,
    goal: k.goal,
    current: k.current,
    status: k.statusDash,
    points: k.points,
    maxPoints: k.maxPoints,
    pct: k.pct,
    isCurrency: !!k.isCurrency,
    subtitle: k.metaLabel.replace("Meta:", `Meta: `),
    editable: true,
    inverse: false,
  }));

  // 7º card: Ausências (não editável, invertido)
  const aus = snap.ausencias;
  kpiCards.push({
    id: "ausencias",
    label: "Ausências",
    goal: 0,
    current: aus,
    status: aus === 0 ? "green" : aus <= 2 ? "yellow" : "red",
    points: Math.max(15 - aus * 5, 0),
    maxPoints: 15,
    pct: Math.max(100 - aus * 33, 0),
    isCurrency: false,
    subtitle: "Meta: zero ausências no semestre",
    editable: false,
    inverse: true,
  });

  // 8º card: Substituições — apenas informativo. NÃO entra no cálculo do semáforo/pontuação
  // e não gera ação no Plano de Ação; existe só para acompanhar a regra de manutenção do
  // grupo (contrato permite no máximo 2 substituições por semestre).
  const subs = snap.substituicoes;
  const subsStatus = subs === 0 ? "green" : subs === 1 ? "yellow" : "red";
  kpiCards.push({
    id: "substituicoes",
    label: "Substituições",
    goal: 2,
    current: subs,
    status: subsStatus,
    points: 0,
    maxPoints: 0,
    pct: Math.max(100 - subs * 50, 0),
    isCurrency: false,
    subtitle: "Regra de manutenção do grupo: até 2 substituições no semestre. Não afeta sua pontuação.",
    editable: false,
    inverse: false,
    noScore: true,
    statusLabel:
      subsStatus === "green" ? "Dentro do limite" : subsStatus === "yellow" ? "Atenção ao limite" : "Limite atingido",
  });

  return (
    <DashboardClient
      name={session.name}
      score={snap.score}
      targetScore={snap.goals.targetScore}
      windowLabel={snap.window.label}
      totalReunioes={snap.totalReunioes}
      presencas={snap.presencas}
      ausencias={snap.ausencias}
      statusCard={snap.statusCard}
      kpis={kpiCards}
      actions={snap.actions.map((a) => ({
        id: a.kpi.id,
        label: a.kpi.label,
        isCurrency: !!a.kpi.isCurrency,
        goal: a.kpi.goal,
        currentValue: a.currentValue,
        urgency: a.urgency,
        actionMessage: a.actionMessage,
      }))}
      months={snap.months.map((m) => ({
        monthLabel: m.monthLabel,
        monthIndex: m.monthIndex,
        status: m.status,
        score: m.score,
        belowGoal: m.belowGoal.map(shortLabel),
        nearGoal: m.nearGoal.map(shortLabel),
      }))}
      refsAnalise={snap.refsRecebidasAnalise}
      outlook={snap.outlook}
      pendencias={snap.pendencias}
      unread={unread}
      hasSixMonths={snap.hasSixMonths}
    />
  );
}
