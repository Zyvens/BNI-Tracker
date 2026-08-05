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

// Cadência padrão de reuniões do BNI (~1/semana) e duração da janela móvel oficial.
export const MEETINGS_PER_MONTH = 4;
export const FULL_WINDOW_MONTHS = 6;

// Quantos meses de casa o membro tem, com base no total de reuniões já registradas
// (oficial ou manual). Um membro que entrou no meio do semestre não deve ser cobrado
// pelas metas de 6 meses inteiros — suas metas devem ser proporcionais ao seu tempo
// real de participação. Resultado limitado a [0, 6].
export function computeTenureMonths(totalReunioes: number): number {
  const months = totalReunioes / MEETINGS_PER_MONTH;
  return Math.min(Math.max(months, 0), FULL_WINDOW_MONTHS);
}

// Metas proporcionais ao tempo de casa. Membros com tenure completo (6 meses) mantêm
// as metas configuradas pelo coordenador sem alteração. Cada meta é arredondada e
// nunca fica em zero (evitaria divisão por zero e faria qualquer registro "bater a
// meta" instantaneamente). targetScore/safetyMargin não são afetados — a pontuação
// continua sendo sempre 0-100.
export function proratedGoals(g: Goals, tenureMonths: number): Goals {
  const factor = Math.min(Math.max(tenureMonths, 0), FULL_WINDOW_MONTHS) / FULL_WINDOW_MONTHS;
  if (factor >= 1) return g;
  const scale = (v: number) => Math.max(Math.round(v * factor), 1);
  return {
    ...g,
    refDadas: scale(g.refDadas),
    convidados: scale(g.convidados),
    reunioes1a1: scale(g.reunioes1a1),
    uegs: scale(g.uegs),
    testemunhos: scale(g.testemunhos),
    opnf: scale(g.opnf),
  };
}

export type KpiDef = {
  id: KpiId;
  label: string;
  shortLabel: string;
  goal: number;
  isCurrency?: boolean;
  metaLabel: string;
};

// periodLabel/showWeeklyHint permitem adaptar o texto da meta quando ela foi
// proporcionalizada ao tempo de casa do membro (ver proratedGoals) — nesse caso o
// período não é mais "6 meses" e a dica "~1/semana" (calibrada para 6 meses cheios)
// deixa de fazer sentido.
export function buildKpis(
  g: Goals = DEFAULT_GOALS,
  periodLabel: string = "6 meses",
  showWeeklyHint: boolean = true
): KpiDef[] {
  const money = (v: number) => `R$ ${v.toLocaleString("pt-BR")}`;
  const weekly = (hint: string) => (showWeeklyHint ? ` (${hint})` : "");
  return [
    { id: "convidados", label: "Convidados", shortLabel: "Conv.", goal: g.convidados, metaLabel: `Meta: ${g.convidados} em ${periodLabel}` },
    { id: "refDadas", label: "Referências Dadas", shortLabel: "Refs Dadas", goal: g.refDadas, metaLabel: `Meta: ${g.refDadas} em ${periodLabel}${weekly("~1/semana")}` },
    { id: "uegs", label: "UEGs", shortLabel: "UEGs", goal: g.uegs, metaLabel: `Meta: ${g.uegs} em ${periodLabel}` },
    { id: "reunioes1a1", label: "Reuniões 1-a-1", shortLabel: "1-a-1", goal: g.reunioes1a1, metaLabel: `Meta: ${g.reunioes1a1} em ${periodLabel}${weekly("~1/semana")}` },
    { id: "testemunhos", label: "Testemunhos", shortLabel: "Testemunhos", goal: g.testemunhos, metaLabel: `Meta: ${g.testemunhos} em ${periodLabel}` },
    { id: "opnf", label: "OPNF", shortLabel: "OPNF", goal: g.opnf, isCurrency: true, metaLabel: `Meta: ${money(g.opnf)} em ${periodLabel}` },
  ];
}

// Semáforo por KPI — regra única do semáforo, usada em TODAS as telas
// (Dashboard, Saúde DMI, Rumo aos 100): verde >= meta; amarelo >= ~78% da meta
// (faixa intermediária oficial); vermelho abaixo disso.
export function kpiStatus(v: number, goal: number): Status {
  if (v >= goal) return "green";
  if (v >= Math.floor(goal * 0.78)) return "yellow";
  return "red";
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

// Faixa oficial do semáforo por pontuação total: >=70 verde, 40-69 amarelo, <40 vermelho.
export function scoreSemaforoStatus(score: number): Status {
  if (score >= 70) return "green";
  if (score >= 40) return "yellow";
  return "red";
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

// Semáforo de urgência do Plano de Ação — 3 níveis por margem em MESES, não por
// indicador isolado: critical (vermelho) = zero margem, precisa agir ainda neste mês;
// urgent (amarelo) = margem só até o mês seguinte; watch (azul) = 3+ meses de margem
// de segurança pela frente (inclui o caso de nunca cair dentro da janela de 6 meses).
export type Urgency = "critical" | "urgent" | "watch";

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

  // Projeta a janela móvel ancorada em `currentValues` (o valor real de agora, que já
  // reflete registros semanais E ajustes rápidos feitos pelo membro no dashboard —
  // KpiOverride) em vez de reconstruir o total do zero somando `production`. Reconstruir
  // do zero ignorava qualquer registro que só existisse como ajuste rápido (sem uma
  // entrada correspondente em `production`), fazendo o "faltam X" não descontar o que
  // o usuário já havia registrado no período corrente. Aqui só ajustamos o valor atual
  // pelos meses que saem (mais antigos, saindo da janela) e entram (novos, normalmente
  // zero, pois ainda não há registros futuros) conforme os meses avançam.
  const rollingValue = (monthsAhead: number): KpiValues => {
    const out: KpiValues = { ...currentValues };
    for (let i = 0; i < monthsAhead; i++) {
      const leaving = production.get(monthKey(new Date(today.getFullYear(), today.getMonth() - 5 + i, 1)));
      const entering = production.get(monthKey(new Date(today.getFullYear(), today.getMonth() + 1 + i, 1)));
      for (const k of Object.keys(out) as KpiId[]) {
        out[k] = out[k] - (leaving ? leaving[k] : 0) + (entering ? entering[k] : 0);
      }
    }
    return out;
  };

  for (let c = 1; c <= 6; c++) {
    const target = new Date(today.getFullYear(), today.getMonth() + c, 1);
    const values = rollingValue(c);
    const belowGoal: string[] = [];
    const nearGoal: string[] = [];
    for (const kpi of KPIS) {
      const v = values[kpi.id];
      if (v < kpi.goal) belowGoal.push(kpi.id);
      else if (v < kpi.goal * 1.15) nearGoal.push(kpi.id);
    }
    const monthScore = computeScore(values, ausencias, atrasos, goals);
    months.push({
      monthLabel: target.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
      monthShortLabel: target.toLocaleDateString("pt-BR", { month: "short" }),
      monthIndex: c,
      values,
      belowGoal,
      nearGoal,
      // Cor do semáforo pela pontuação projetada (mesma faixa oficial usada no resto do app),
      // não apenas por "algum indicador abaixo da meta" — evita mostrar vermelho quando a
      // pontuação total ainda está em zona verde/amarela.
      status: scoreSemaforoStatus(monthScore),
      score: monthScore,
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

    // Meses de margem até a queda: monthIndex 1 = cai já no mês seguinte (zero margem
    // agora); monthIndex 2 = margem dura até o mês seguinte; monthIndex >= 3 (ou nenhuma
    // queda prevista) = 3+ meses de segurança.
    let urgency: Urgency;
    if (isBelow) urgency = "critical";
    else if (!firstDrop) urgency = "watch";
    else if (firstDrop.monthIndex <= 1) urgency = "critical";
    else if (firstDrop.monthIndex === 2) urgency = "urgent";
    else urgency = "watch";

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

  if (critical.length > 0) {
    // Já abaixo da meta agora — o pior caso dentro do vermelho.
    const alreadyBelow = critical.filter((a) => a.isAlreadyBelow);
    if (alreadyBelow.length > 0) {
      return {
        status: "red",
        emoji: "🔴",
        title: `Atenção! ${alreadyBelow.length} indicador${alreadyBelow.length > 1 ? "es" : ""} abaixo da meta`,
        subtitle: `${alreadyBelow.map((c) => c.kpi.shortLabel).join(", ")} ${alreadyBelow.length > 1 ? "precisam" : "precisa"} de ação imediata.`,
      };
    }
    // Ainda dentro da meta, mas zero margem: cai já no mês que vem se nada for feito agora.
    const soonest = critical.reduce((m, d) => ((d.daysUntilDrop ?? 999) < (m.daysUntilDrop ?? 999) ? d : m));
    return {
      status: "red",
      emoji: "🔴",
      title: `Atenção! Em ${soonest.daysUntilDrop} dias você pode ficar abaixo da meta de ${soonest.kpi.shortLabel}`,
      subtitle: "Sem margem neste mês — registre ainda agora. Verifique o plano de ação abaixo.",
    };
  }
  if (urgent.length > 0) {
    const soonest = urgent.reduce((m, d) => ((d.daysUntilDrop ?? 999) < (m.daysUntilDrop ?? 999) ? d : m));
    return {
      status: "yellow",
      emoji: "🟡",
      title: `Atenção! Sua margem de ${soonest.kpi.shortLabel} dura só até o mês que vem`,
      subtitle: `Se nenhum novo registro for feito, você ficará abaixo da meta em ${soonest.dropMonthLabel}.`,
    };
  }
  return {
    status: "green",
    emoji: "🟢",
    title: "Você está 100% dentro da meta",
    subtitle: "Todos os indicadores têm 3 ou mais meses de margem de segurança. Continue assim!",
  };
}

export function kpiDica(id: KpiId, v: number, goal: number, isCurrency = false, periodMonths: number = 6): string {
  const gap = goal - v;
  const fmt = (n: number) => (isCurrency ? `R$ ${n.toLocaleString("pt-BR")}` : `${n}`);
  const perMonth = (goal / Math.max(periodMonths, 1)).toFixed(1);
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
    case "refDadas": return `Faltam ${fmt(gap)} referências. Meta: ~${perMonth}/mês.`;
    case "uegs": return `Faltam ${fmt(gap)} UEGs. Participe de todos os UEGs das próximas reuniões.`;
    case "reunioes1a1": return `Faltam ${fmt(gap)} reuniões 1-a-1. Meta: ~${perMonth}/mês.`;
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
