// Motor de metas, semáforo, pontuação e projeção de caducidade.
// Regras espelhadas do relatório oficial "Semáforos" do BNI.
// Metas configuráveis pelo coordenador (Settings).

export type KpiId =
  | "convidados"
  | "refDadas"
  | "uegs"
  | "reunioes1a1"
  | "testemunhos"
  | "opnf";

export type KpiValues = Record<KpiId, number>;

export type Status = "green" | "yellow" | "red";

export type Goals = {
  refDadas: number;
  convidados: number;
  reunioes1a1: number;
  uegs: number;
  testemunhos: number;
  opnf: number;
  targetScore: number;
  safetyMargin: number;
};

export const DEFAULT_GOALS: Goals = {
  refDadas: 27,
  convidados: 8,
  reunioes1a1: 22,
  uegs: 22,
  testemunhos: 2,
  opnf: 20000,
  targetScore: 100,
  safetyMargin: 10,
};

export type KpiDef = {
  id: KpiId;
  label: string;
  shortLabel: string;
  goal: number;
  isCurrency?: boolean;
  metaLabel: string;
};

export function buildKpis(g: Goals = DEFAULT_GOALS): KpiDef[] {
  const money = (v: number) => `R$ ${v.toLocaleString("pt-BR")}`;
  return [
    { id: "convidados", label: "Convidados", shortLabel: "Conv.", goal: g.convidados, metaLabel: `Meta: ${g.convidados} em 6 meses` },
    { id: "refDadas", label: "Referências Dadas", shortLabel: "Refs Dadas", goal: g.refDadas, metaLabel: `Meta: ${g.refDadas} em 6 meses (~1/semana)` },
    { id: "uegs", label: "UEGs", shortLabel: "UEGs", goal: g.uegs, metaLabel: `Meta: ${g.uegs} em 6 meses` },
    { id: "reunioes1a1", label: "Reuniões 1-a-1", shortLabel: "1-a-1", goal: g.reunioes1a1, metaLabel: `Meta: ${g.reunioes1a1} em 6 meses (~1/semana)` },
    { id: "testemunhos", label: "Testemunhos", shortLabel: "Testemunhos", goal: g.testemunhos, metaLabel: `Meta: ${g.testemunhos} em 6 meses` },
    { id: "opnf", label: "OPNF", shortLabel: "OPNF", goal: g.opnf, isCurrency: true, metaLabel: `Meta: ${money(g.opnf)} em 6 meses` },
  ];
}

// Semáforo por KPI: verde >= meta; amarelo >= ~78% da meta; vermelho abaixo.
export function kpiStatus(v: number, goal: number): Status {
  if (v >= goal) return "green";
  if (v >= Math.floor(goal * 0.78)) return "yellow";
  return "red";
}

// Semáforo do dashboard: vermelho abaixo da meta; amarelo pouca margem acima
// (menos de ~10% de folga); verde com folga confortável.
export function dashboardStatus(v: number, goal: number): Status {
  if (v < goal) return "red";
  const margin = Math.max(Math.ceil(goal * 0.1), 2);
  return v < goal + margin ? "yellow" : "green";
}

// Pontos de um KPI individual (pesos do Semáforo oficial)
export function kpiPoints(id: KpiId, v: number, g: Goals = DEFAULT_GOALS): { points: number; maxPoints: number } {
  const calc = (goal: number, max: number) => (v >= goal ? max : Math.round((v / goal) * max));
  switch (id) {
    case "refDadas": return { points: calc(g.refDadas, 20), maxPoints: 20 };
    case "convidados": return { points: calc(g.convidados, 20), maxPoints: 20 };
    case "reunioes1a1": return { points: calc(g.reunioes1a1, 10), maxPoints: 10 };
    case "uegs": return { points: calc(g.uegs, 10), maxPoints: 10 };
    case "testemunhos": return { points: calc(g.testemunhos, 5), maxPoints: 5 };
    case "opnf": return { points: calc(g.opnf, 15), maxPoints: 15 };
  }
}

// Pontuação 0-100 no padrão do Semáforo oficial (pesos: 20/20/10/10/5/15 + 15 presenças + 5 pontualidade)
export function computeScore(v: KpiValues, ausencias: number, atrasos: number, g: Goals = DEFAULT_GOALS): number {
  let s = 0;
  s += v.refDadas >= g.refDadas ? 20 : Math.round((v.refDadas / g.refDadas) * 20);
  s += v.convidados >= g.convidados ? 20 : Math.round((v.convidados / g.convidados) * 20);
  s += v.reunioes1a1 >= g.reunioes1a1 ? 10 : Math.round((v.reunioes1a1 / g.reunioes1a1) * 10);
  s += v.uegs >= g.uegs ? 10 : Math.round((v.uegs / g.uegs) * 10);
  s += v.testemunhos >= g.testemunhos ? 5 : Math.round((v.testemunhos / g.testemunhos) * 5);
  s += v.opnf >= g.opnf ? 15 : Math.round((v.opnf / g.opnf) * 15);
  s += Math.max(15 - ausencias * 5, 0);
  s += atrasos === 0 ? 5 : atrasos === 1 ? 2 : 0;
  return Math.min(s, 100);
}

export type Urgency = "critical" | "urgent" | "watch" | "safe";

export type KpiAction = {
  kpi: KpiDef;
  currentValue: number;
  isAlreadyBelow: boolean;
  safeUntilLabel: string | null;
  dropMonthLabel: string | null;
  daysUntilDrop: number | null;
  neededToRecover: number;
  // quanto registrar para criar margem de segurança além da meta
  safetyExtra: number;
  actionMessage: string;
  urgency: Urgency;
};

export type MonthProjection = {
  monthLabel: string;
  monthShortLabel: string;
  monthIndex: number;
  values: KpiValues;
  belowGoal: string[];
  nearGoal: string[];
  status: Status;
  score: number;
};

export type MonthlyProduction = Map<string, KpiValues>;

export function emptyValues(): KpiValues {
  return { convidados: 0, refDadas: 0, uegs: 0, reunioes1a1: 0, testemunhos: 0, opnf: 0 };
}

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Projeção dos próximos 6 meses: para cada mês futuro, recalcula a janela móvel
// de 6 meses somando a produção mensal conhecida. Sem novos registros, os meses
// antigos "caducam" e os valores caem.
export function computeProjection(
  production: MonthlyProduction,
  currentValues: KpiValues,
  goals: Goals = DEFAULT_GOALS,
  today = new Date(),
  ausencias = 0,
  atrasos = 0
): { months: MonthProjection[]; actions: KpiAction[] } {
  const KPIS = buildKpis(goals);
  const months: MonthProjection[] = [];

  const windowSum = (endMonth: Date): KpiValues => {
    const out = emptyValues();
    for (let i = 0; i < 6; i++) {
      const m = new Date(endMonth.getFullYear(), endMonth.getMonth() - i, 1);
      const p = production.get(monthKey(m));
      if (p) for (const k of Object.keys(out) as KpiId[]) out[k] += p[k];
    }
    return out;
  };

  for (let c = 1; c <= 6; c++) {
    const target = new Date(today.getFullYear(), today.getMonth() + c, 1);
    const values = windowSum(target);
    const belowGoal: string[] = [];
    const nearGoal: string[] = [];
    for (const kpi of KPIS) {
      const v = values[kpi.id];
      if (v < kpi.goal) belowGoal.push(kpi.id);
      else if (v < kpi.goal * 1.15) nearGoal.push(kpi.id);
    }
    months.push({
      monthLabel: target.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
      monthShortLabel: target.toLocaleDateString("pt-BR", { month: "short" }),
      monthIndex: c,
      values,
      belowGoal,
      nearGoal,
      status: belowGoal.length > 0 ? "red" : nearGoal.length > 0 ? "yellow" : "green",
      score: computeScore(values, ausencias, atrasos, goals),
    });
  }

  const actions: KpiAction[] = [];
  for (const kpi of KPIS) {
    const current = currentValues[kpi.id];
    const isBelow = current < kpi.goal;
    const firstDrop = months.find((m) => m.values[kpi.id] < kpi.goal);
    const safeMonths = months.filter((m) => m.values[kpi.id] >= kpi.goal);
    const lastSafe = safeMonths.length > 0 ? safeMonths[safeMonths.length - 1] : null;

    let daysUntilDrop: number | null = null;
    let dropMonthLabel: string | null = null;
    if (firstDrop) {
      dropMonthLabel = firstDrop.monthLabel;
      const dropDate = new Date(today.getFullYear(), today.getMonth() + firstDrop.monthIndex, 1);
      daysUntilDrop = Math.ceil((dropDate.getTime() - today.getTime()) / 86400000);
    }

    const needed = isBelow
      ? kpi.goal - current
      : firstDrop
        ? Math.max(kpi.goal - firstDrop.values[kpi.id] + 1, 0)
        : 0;

    // margem de segurança sugerida: ~10% acima da meta
    const safetyTarget = Math.ceil(kpi.goal * 1.1);
    const safetyExtra = Math.max(safetyTarget - current, 0);

    let urgency: Urgency;
    if (isBelow) urgency = "critical";
    else if (firstDrop) urgency = daysUntilDrop !== null && daysUntilDrop <= 30 ? "urgent" : "watch";
    else urgency = "safe";

    const fmt = (n: number) => (kpi.isCurrency ? `R$ ${n.toLocaleString("pt-BR")}` : `${n}`);

    let msg: string;
    if (isBelow) {
      msg = `Já abaixo da meta. Registre ${fmt(needed)} o quanto antes para recuperar.`;
    } else if (!firstDrop) {
      msg = lastSafe
        ? `Você tem margem suficiente além de ${lastSafe.monthLabel}. Nenhuma ação imediata necessária.`
        : "Você está seguro nos próximos 6 meses. Continue no ritmo atual!";
    } else {
      const gap = kpi.goal - firstDrop.values[kpi.id];
      msg = lastSafe
        ? `Você possui margem suficiente até ${lastSafe.monthLabel}. Se nenhum novo registro for feito, a partir de ${dropMonthLabel} será necessário registrar ao menos ${fmt(gap + 1)} para permanecer acima da meta.`
        : `Sem novos registros, em ${dropMonthLabel} você ficará abaixo da meta. Registre ao menos ${fmt(gap + 1)} antes disso.`;
    }

    actions.push({
      kpi,
      currentValue: current,
      isAlreadyBelow: isBelow,
      safeUntilLabel: lastSafe ? lastSafe.monthLabel : null,
      dropMonthLabel,
      daysUntilDrop,
      neededToRecover: needed,
      safetyExtra,
      actionMessage: msg,
      urgency,
    });
  }

  return { months, actions };
}

export type StatusCard = {
  status: Status;
  emoji: string;
  title: string;
  subtitle: string;
};

export function computeStatusCard(actions: KpiAction[]): StatusCard {
  const critical = actions.filter((a) => a.urgency === "critical");
  const urgent = actions.filter((a) => a.urgency === "urgent");
  const watch = actions.filter((a) => a.urgency === "watch");

  if (critical.length > 0) {
    return {
      status: "red",
      emoji: "🔴",
      title: `Atenção! ${critical.length} indicador${critical.length > 1 ? "es" : ""} abaixo da meta`,
      subtitle: `${critical.map((c) => c.kpi.shortLabel).join(", ")} ${critical.length > 1 ? "precisam" : "precisa"} de ação imediata.`,
    };
  }
  if (urgent.length > 0) {
    const soonest = urgent.reduce((m, d) => ((d.daysUntilDrop ?? 999) < (m.daysUntilDrop ?? 999) ? d : m));
    return {
      status: "yellow",
      emoji: "🟡",
      title: `Atenção! Em ${soonest.daysUntilDrop} dias você pode ficar abaixo da meta de ${soonest.kpi.shortLabel}`,
      subtitle: "Se nenhum novo registro for feito. Verifique o plano de ação abaixo.",
    };
  }
  if (watch.length > 0) {
    const soonest = watch.reduce((m, d) => ((d.daysUntilDrop ?? 999) < (m.daysUntilDrop ?? 999) ? d : m));
    return {
      status: "yellow",
      emoji: "🟡",
      title: `Nenhuma ação urgente. Próxima atenção: ${soonest.kpi.shortLabel}`,
      subtitle: `Você ficará abaixo da meta de ${soonest.kpi.label} em ${soonest.dropMonthLabel} se nenhum novo registro for feito.`,
    };
  }
  return {
    status: "green",
    emoji: "🟢",
    title: "Você está 100% dentro da meta",
    subtitle: "Todos os indicadores estão seguros nos próximos 6 meses. Continue assim!",
  };
}

export function kpiDica(id: KpiId, v: number, goal: number, isCurrency = false): string {
  const gap = goal - v;
  const fmt = (n: number) => (isCurrency ? `R$ ${n.toLocaleString("pt-BR")}` : `${n}`);
  if (v >= goal) {
    switch (id) {
      case "convidados": return "Meta atingida! Continue trazendo convidados para manter o DMI saudável.";
      case "refDadas": return "Meta atingida! Continue gerando referências consistentemente.";
      case "uegs": return "Meta atingida! Mantenha presença nos UEGs semanais.";
      case "reunioes1a1": return "Meta atingida! Continue com 1 reunião 1-a-1 por semana.";
      case "testemunhos": return "Meta atingida! Testemunhos fortalecem a cultura Givers Gain.";
      case "opnf": return "Meta atingida! Continue registrando negócios fechados na janela.";
    }
  }
  switch (id) {
    case "convidados": return `Faltam ${fmt(gap)} convidados para a meta. Leve pelo menos 1 por reunião.`;
    case "refDadas": return `Faltam ${fmt(gap)} referências. Meta: ~${(goal / 6).toFixed(1)}/mês ou 1/semana.`;
    case "uegs": return `Faltam ${fmt(gap)} UEGs. Participe de todos os UEGs das próximas reuniões.`;
    case "reunioes1a1": return `Faltam ${fmt(gap)} reuniões 1-a-1. Agende pelo menos 1 por semana.`;
    case "testemunhos": return `Faltam ${fmt(gap)} testemunho(s). Compartilhe resultados de parceiros em reunião.`;
    case "opnf": return `Faltam ${fmt(gap)} em OPNF. Registre todos os negócios fechados.`;
  }
}

// ---- Projeções do dashboard ampliado (especificação funcional) ----

export type ScoreOutlook = {
  score: number;
  projectedScore: number; // ritmo atual mantido até o fim do período
  daysRemaining: number; // até o fechamento do período vigente (fim do mês)
  periodEndLabel: string;
  marginPoints: number; // pontos acima/abaixo da meta
  riskLevel: "em_dia" | "atencao" | "risco";
  probability: number; // 0-100 probabilidade heurística de manter/alcançar a meta
};

export function computeOutlook(
  score: number,
  months: MonthProjection[],
  goals: Goals,
  today = new Date()
): ScoreOutlook {
  const periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const daysRemaining = Math.max(Math.ceil((periodEnd.getTime() - today.getTime()) / 86400000), 0);
  const projectedScore = months.length > 0 ? months[0].score : score;
  const marginPoints = score - goals.targetScore;

  let riskLevel: ScoreOutlook["riskLevel"];
  if (score >= goals.targetScore && projectedScore >= goals.targetScore) riskLevel = "em_dia";
  else if (score >= goals.targetScore * 0.9) riskLevel = "atencao";
  else riskLevel = "risco";

  // Heurística simples: distância da meta hoje + tendência da projeção
  let probability = 50;
  probability += Math.max(Math.min(marginPoints * 3, 30), -30);
  probability += projectedScore >= score ? 10 : -10;
  probability = Math.max(Math.min(Math.round(probability), 99), 1);

  return {
    score,
    projectedScore,
    daysRemaining,
    periodEndLabel: periodEnd.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" }),
    marginPoints,
    riskLevel,
    probability,
  };
}

export function formatMoney(v: number): string {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
