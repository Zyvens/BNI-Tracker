"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Bell,
  ChevronDown,
  AlertCircle,
  Send,
  UserPlus,
  Users,
  Lightbulb,
  MessageSquareQuote,
  Banknote,
  UserX,
  CalendarClock,
  Target,
  TrendingUp,
  ShieldCheck,
  ClipboardCheck,
  TrendingUpDown,
  X,
  Check,
} from "lucide-react";
import { ScoreRing, ProgressBar, STATUS_COLORS, StatusKey, fmtMoney, fadeUp, stagger } from "@/components/ui";
import LogoutButton from "@/components/LogoutButton";

const KPI_ICONS: Record<string, any> = {
  refDadas: Send,
  convidados: UserPlus,
  reunioes1a1: Users,
  uegs: Lightbulb,
  testemunhos: MessageSquareQuote,
  opnf: Banknote,
  ausencias: UserX,
};

const URGENCY_STYLE: Record<string, { bg: string; border: string; color: string; dot: string }> = {
  critical: { bg: "#FFF1F1", border: "#FECACA", color: "#CC0000", dot: "🔴" },
  urgent: { bg: "#FFFBEB", border: "#FDE68A", color: "#D97706", dot: "🟡" },
  watch: { bg: "#EFF6FF", border: "#BFDBFE", color: "#2563EB", dot: "🔵" },
  safe: { bg: "#F0FDF4", border: "#BBF7D0", color: "#16A34A", dot: "🟢" },
};

type Kpi = {
  id: string;
  label: string;
  goal: number;
  current: number;
  status: StatusKey;
  points: number;
  maxPoints: number;
  pct: number;
  isCurrency: boolean;
  subtitle: string;
  editable: boolean;
  inverse: boolean;
};

type Props = {
  name: string;
  score: number;
  targetScore: number;
  windowLabel: string;
  totalReunioes: number;
  presencas: number;
  ausencias: number;
  statusCard: { status: StatusKey; emoji: string; title: string; subtitle: string };
  kpis: Kpi[];
  actions: { id: string; label: string; isCurrency: boolean; goal: number; currentValue: number; urgency: string; actionMessage: string }[];
  months: { monthLabel: string; monthIndex: number; status: StatusKey; belowGoal: string[]; nearGoal: string[] }[];
  refsAnalise: {
    total: number;
    convertidas: number;
    emAndamento: number;
    pendentes: number;
    perdidas: number;
    valorConvertido: number;
    valorEmAndamento: number;
  };
  outlook: {
    projectedScore: number;
    daysRemaining: number;
    periodEndLabel: string;
    marginPoints: number;
    riskLevel: string;
    probability: number;
  };
  pendencias: { declarar: number; confirmar: number; semRetorno: number; paradas: number };
  unread: number;
  hasSixMonths: boolean;
};

export default function DashboardClient(p: Props) {
  const router = useRouter();
  const [planOpen, setPlanOpen] = useState(false);
  const [projOpen, setProjOpen] = useState(false);
  const [editKpi, setEditKpi] = useState<Kpi | null>(null);
  const gold = p.score >= p.targetScore;
  const urgentCount = p.actions.filter((a) => a.urgency === "critical" || a.urgency === "urgent").length;
  const todayLabel = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  const pendTotal = p.pendencias.declarar + p.pendencias.confirmar;
  const totalPoints = p.kpis.reduce((s, k) => s + k.points, 0);
  const headline = gold
    ? "Parabéns! Pontuação máxima atingida!"
    : p.score >= 80
      ? "Excelente desempenho!"
      : p.score >= 60
        ? "Bom ritmo, continue!"
        : "Vamos acelerar!";

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div
        className="bg-surface border-b border-gray-100 sticky top-0 z-30"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="px-4 h-14 flex items-center justify-between">
          <div>
            <h1 className="text-[17px] font-extrabold text-text-main font-display">BNI Tracker</h1>
            <p className="text-[11px] text-text-muted">
              {p.windowLabel} · {todayLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/notificacoes" className="relative w-9 h-9 rounded-full bg-background flex items-center justify-center touch-manipulation">
              <Bell size={16} color="#1A1A1A" strokeWidth={2} />
              {p.unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-white text-[9px] font-extrabold flex items-center justify-center">
                  {p.unread > 9 ? "9+" : p.unread}
                </span>
              )}
            </Link>
            <Link href="/registro-semana">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full touch-manipulation"
                style={{ backgroundColor: "#FFF1F1" }}
              >
                <Zap size={13} color="#CC0000" strokeWidth={2.5} />
                <span className="text-[11px] font-bold text-primary">Registrar</span>
              </motion.div>
            </Link>
            <LogoutButton />
          </div>
        </div>
      </div>

      <motion.div initial="hidden" animate="visible" variants={stagger} className="px-4 py-4 space-y-4">
        {/* Card principal: pontuação */}
        <motion.div
          variants={fadeUp}
          className="bg-surface rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div
            className="h-1.5 w-full"
            style={{ background: gold ? "#F59E0B" : "linear-gradient(90deg, #CC0000, #F59E0B)" }}
          />
          <div className="p-5 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={14} color={gold ? "#F59E0B" : "#CC0000"} strokeWidth={2} />
                <span
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: gold ? "#F59E0B" : "#CC0000" }}
                >
                  {gold ? "Clube 100 🏆" : "Pontuação Semestral"}
                </span>
              </div>
              <p className="text-[15px] font-extrabold text-text-main leading-tight mb-1 font-display">
                {headline}
              </p>
              <p className="text-[12px] text-text-muted leading-relaxed">
                {p.windowLabel} · {p.totalReunioes} reuniões
              </p>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-50">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  <span className="text-[10px] font-bold text-success">{p.presencas} presenças</span>
                </div>
                {p.ausencias > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-50">
                    <span className="w-1.5 h-1.5 rounded-full bg-danger" />
                    <span className="text-[10px] font-bold text-danger">{p.ausencias} ausências</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-shrink-0">
              <ScoreRing score={p.score} max={p.targetScore} />
            </div>
          </div>

          {/* Projeção resumida (especificação funcional) */}
          <div className="grid grid-cols-4 border-t border-gray-100 divide-x divide-gray-100">
            {[
              { label: "Projeção", value: `${p.outlook.projectedScore}`, color: p.outlook.projectedScore >= p.targetScore ? "#22C55E" : p.outlook.projectedScore >= p.score ? "#F59E0B" : "#CC0000" },
              { label: "Dias rest.", value: `${p.outlook.daysRemaining}`, color: "#1A1A1A" },
              { label: "Margem", value: `${p.outlook.marginPoints >= 0 ? "+" : ""}${p.outlook.marginPoints}`, color: p.outlook.marginPoints >= 0 ? "#22C55E" : "#CC0000" },
              { label: "Prob. 100", value: `${p.outlook.probability}%`, color: p.outlook.probability >= 70 ? "#22C55E" : p.outlook.probability >= 40 ? "#F59E0B" : "#CC0000" },
            ].map((s) => (
              <div key={s.label} className="py-2.5 flex flex-col items-center">
                <span className="text-[14px] font-extrabold font-display" style={{ color: s.color }}>
                  {s.value}
                </span>
                <span className="text-[9px] text-text-muted font-semibold">{s.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Banner de status */}
        <motion.div
          variants={fadeUp}
          className="rounded-2xl p-4 border"
          style={{
            backgroundColor: STATUS_COLORS[p.statusCard.status].bg,
            borderColor: STATUS_COLORS[p.statusCard.status].border,
          }}
        >
          <div className="flex items-start gap-3">
            <span className="text-[18px] flex-shrink-0">{p.statusCard.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-extrabold leading-tight mb-1 font-display" style={{ color: STATUS_COLORS[p.statusCard.status].color }}>
                {p.statusCard.title}
              </p>
              <p className="text-[12px] leading-relaxed" style={{ color: STATUS_COLORS[p.statusCard.status].color + "CC" }}>
                {p.statusCard.subtitle}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Pendências de confirmação */}
        {pendTotal > 0 && (
          <motion.div variants={fadeUp}>
            <Link href="/feed?filtro=agradecimentos">
              <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 px-4 py-3.5 flex items-center gap-3 touch-manipulation">
                <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
                  <ClipboardCheck size={17} color="#2563EB" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-extrabold text-text-main font-display">Confirmações pendentes</p>
                  <p className="text-[11px] text-text-muted">
                    {p.pendencias.confirmar > 0 && `${p.pendencias.confirmar} valor(es) para confirmar`}
                    {p.pendencias.confirmar > 0 && p.pendencias.declarar > 0 && " · "}
                    {p.pendencias.declarar > 0 && `${p.pendencias.declarar} negócio(s) para declarar`}
                  </p>
                </div>
                <ChevronDown size={16} className="-rotate-90 text-text-muted" />
              </div>
            </Link>
          </motion.div>
        )}

        {/* Plano de Ação */}
        <motion.div variants={fadeUp} className="bg-surface rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <motion.button
            whileTap={{ scale: 0.99 }}
            onClick={() => setPlanOpen(!planOpen)}
            className="w-full flex items-center justify-between px-4 py-4 touch-manipulation"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertCircle size={17} color="#CC0000" strokeWidth={2} />
              </div>
              <div className="text-left">
                <p className="text-[14px] font-extrabold text-text-main font-display">Plano de Ação</p>
                <p className="text-[11px] text-text-muted">{urgentCount} ações urgentes</p>
              </div>
            </div>
            <motion.div animate={{ rotate: planOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={18} color="#8A8A8E" strokeWidth={2} />
            </motion.div>
          </motion.button>
          <AnimatePresence>
            {planOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-3 border-t border-gray-50 pt-3">
                  {[...p.actions]
                    .sort((a, b) => rank(a.urgency) - rank(b.urgency))
                    .map((a) => {
                      const st = URGENCY_STYLE[a.urgency];
                      return (
                        <div key={a.id} className="rounded-xl p-3 border" style={{ backgroundColor: st.bg, borderColor: st.border }}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[12px]">{st.dot}</span>
                            <span className="text-[12px] font-extrabold font-display" style={{ color: st.color }}>
                              {a.label}
                            </span>
                            <span className="text-[10px] text-text-muted ml-auto">
                              {a.isCurrency ? fmtMoney(a.currentValue) : a.currentValue} / {a.isCurrency ? fmtMoney(a.goal) : a.goal}
                            </span>
                          </div>
                          <p className="text-[11px] leading-relaxed" style={{ color: st.color }}>
                            {a.actionMessage}
                          </p>
                        </div>
                      );
                    })}
                  {!p.hasSixMonths && (
                    <p className="text-[10px] text-text-muted px-1">
                      As projeções de caducidade ficam mais precisas com 6 meses de dados registrados.
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Indicadores do semestre */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Indicadores do Semestre
            </p>
            <span className="text-[10px] text-text-muted font-medium">{totalPoints}/100 pts</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {p.kpis.map((k) => (
              <KpiCard key={k.id} kpi={k} onClick={() => k.editable && setEditKpi(k)} />
            ))}
          </div>
        </motion.div>

        {/* Análise das Referências Recebidas */}
        {p.refsAnalise.total > 0 && <RefsAnaliseCard a={p.refsAnalise} />}

        {/* Projeção de KPIs */}
        <motion.div variants={fadeUp} className="bg-surface rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <motion.button
            whileTap={{ scale: 0.99 }}
            onClick={() => setProjOpen(!projOpen)}
            className="w-full flex items-center justify-between px-4 py-4 touch-manipulation"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                <TrendingUpDown size={17} color="#8B5CF6" strokeWidth={2} />
              </div>
              <div className="text-left">
                <p className="text-[14px] font-extrabold text-text-main font-display">Projeção de KPIs</p>
                <p className="text-[11px] text-text-muted">Janela móvel de 6 meses</p>
              </div>
            </div>
            <motion.div animate={{ rotate: projOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={18} color="#8A8A8E" strokeWidth={2} />
            </motion.div>
          </motion.button>
          <AnimatePresence>
            {projOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-2 border-t border-gray-50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted pt-3 mb-3">
                    Próximos 6 meses — status por janela
                  </p>
                  {p.months.map((m) => {
                    const st = STATUS_COLORS[m.status];
                    return (
                      <div
                        key={m.monthIndex}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl border"
                        style={{ backgroundColor: st.bg, borderColor: st.border }}
                      >
                        <span className="text-[13px]">{st.emoji}</span>
                        <span className="flex-1 text-[13px] font-semibold text-text-main capitalize">{m.monthLabel}</span>
                        {m.belowGoal.length > 0 && (
                          <span className="text-[10px] font-bold text-danger">{m.belowGoal.join(", ")}</span>
                        )}
                        {m.belowGoal.length === 0 && m.nearGoal.length > 0 && (
                          <span className="text-[10px] font-bold text-warning">{m.nearGoal.join(", ")} próximo</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Sheet: editar KPI */}
      <AnimatePresence>
        {editKpi && (
          <EditKpiSheet
            kpi={editKpi}
            onClose={() => setEditKpi(null)}
            onSaved={() => {
              setEditKpi(null);
              router.refresh();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function rank(u: string): number {
  return u === "critical" ? 0 : u === "urgent" ? 1 : u === "watch" ? 2 : 3;
}

function KpiCard({ kpi: k, onClick }: { kpi: Kpi; onClick: () => void }) {
  const Icon = KPI_ICONS[k.id] ?? Send;
  const st = STATUS_COLORS[k.status];
  const label = k.status === "green" ? "Meta atingida ✓" : k.status === "yellow" ? "Atenção" : "Abaixo da meta";
  const chip = k.isCurrency ? fmtMoney(k.current, true) : `${k.current}`;
  const chipGoal = k.isCurrency ? fmtMoney(k.goal, true) : `${k.inverse ? "0" : k.goal}`;
  const chipBg = k.status === "green" ? "#F0FDF4" : k.status === "yellow" ? "#FFFBEB" : "#FFF1F1";

  return (
    <motion.div
      whileTap={k.editable ? { scale: 0.95 } : undefined}
      onClick={k.editable ? onClick : undefined}
      className="rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col bg-surface"
      style={{ cursor: k.editable ? "pointer" : "default" }}
    >
      <div className="h-1 w-full" style={{ backgroundColor: st.color }} />
      <div className="p-3 flex flex-col gap-2.5 flex-1">
        <div className="flex items-start justify-between">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-background">
            <Icon size={17} color="#1A1A1A" strokeWidth={2} />
          </div>
          <div className="px-2 py-0.5 rounded-full flex-shrink-0 flex items-baseline gap-0.5" style={{ backgroundColor: chipBg }}>
            <span className="text-[10px] font-extrabold leading-none font-display" style={{ color: st.color }}>
              {chip}
            </span>
            <span className="text-[9px] font-semibold leading-none" style={{ color: st.color + "99" }}>
              /{chipGoal}
            </span>
          </div>
        </div>
        <p className="text-[11px] font-bold leading-tight text-text-main font-body">{k.label}</p>
        <div className="flex items-end justify-between gap-1">
          <span className="text-[20px] font-extrabold leading-none text-text-main font-display">{chip}</span>
          <span className="text-[9px] text-text-muted leading-none pb-0.5">
            {k.points}/{k.maxPoints} pts
          </span>
        </div>
        <ProgressBar pct={k.pct} color={st.color} />
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: st.color }} />
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: st.color }}>
            {label}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// Card "Análise das Referências Recebidas" (anel de conversão)
function RefsAnaliseCard({ a }: { a: Props["refsAnalise"] }) {
  const pct = a.total > 0 ? Math.round((a.convertidas / a.total) * 100) : 0;
  const ringColor = pct >= 70 ? "#22C55E" : pct >= 40 ? "#F59E0B" : "#CC0000";
  const circ = 2 * Math.PI * 38;
  const offset = circ - (pct / 100) * circ;

  const rows = [
    { label: "Convertidas", value: a.convertidas, color: "#22C55E", valor: a.valorConvertido },
    { label: "Em Andamento", value: a.emAndamento, color: "#F59E0B", valor: a.valorEmAndamento },
    { label: "Pendentes", value: a.pendentes, color: "#8A8A8E", valor: null },
    { label: "Perdidas", value: a.perdidas, color: "#CC0000", valor: null },
  ];

  return (
    <motion.div variants={fadeUp} className="bg-surface rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #22C55E, #F59E0B)" }} />
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center">
            <TrendingUp size={16} color="#22C55E" strokeWidth={2} />
          </div>
          <div>
            <p className="text-[13px] font-extrabold text-text-main font-display">
              Análise das Referências Recebidas
            </p>
            <p className="text-[10px] text-text-muted">{a.total} referências recebidas no semestre</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center w-24 h-24 flex-shrink-0">
            <svg width="96" height="96" className="-rotate-90">
              <circle cx="48" cy="48" r="38" fill="none" stroke="#E5E7EB" strokeWidth="8" />
              <motion.circle
                cx="48" cy="48" r="38" fill="none"
                stroke={ringColor} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={circ}
                initial={{ strokeDashoffset: circ }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                style={{ filter: `drop-shadow(0 0 4px ${ringColor}60)` }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-[18px] font-extrabold leading-none font-display" style={{ color: ringColor }}>
                {pct}%
              </span>
              <span className="text-[9px] text-text-muted font-semibold leading-tight text-center">
                {a.convertidas}/{a.total}
              </span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }} />
                  <span className="text-[11px] font-semibold text-text-main">{r.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {r.valor !== null && r.valor > 0 && (
                    <span className="text-[10px] font-bold" style={{ color: r.color }}>
                      {fmtMoney(r.valor, true)}
                    </span>
                  )}
                  <span className="text-[13px] font-extrabold font-display" style={{ color: r.color }}>
                    {r.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {a.total > 0 && (
          <>
            <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden flex">
              <motion.div className="h-full" style={{ backgroundColor: "#22C55E" }} initial={{ width: 0 }} animate={{ width: `${(a.convertidas / a.total) * 100}%` }} transition={{ duration: 1, ease: "easeOut" }} />
              <motion.div className="h-full" style={{ backgroundColor: "#F59E0B" }} initial={{ width: 0 }} animate={{ width: `${(a.emAndamento / a.total) * 100}%` }} transition={{ duration: 1, delay: 0.2, ease: "easeOut" }} />
              <motion.div className="h-full" style={{ backgroundColor: "#E5E7EB" }} initial={{ width: 0 }} animate={{ width: `${(a.pendentes / a.total) * 100}%` }} transition={{ duration: 1, delay: 0.3, ease: "easeOut" }} />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-[10px] text-text-muted">
                Taxa de conversão: <strong style={{ color: ringColor }}>{pct}%</strong>
              </p>
              <p className="text-[10px] text-text-muted">{fmtMoney(a.valorConvertido, true)} fechados</p>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

// Sheet de edição rápida de KPI (lançamento em tempo real)
function EditKpiSheet({ kpi, onClose, onSaved }: { kpi: Kpi; onClose: () => void; onSaved: () => void }) {
  const [value, setValue] = useState(String(kpi.current));
  const [saving, setSaving] = useState(false);
  const st = STATUS_COLORS[kpi.status];
  const Icon = KPI_ICONS[kpi.id] ?? Send;

  async function save() {
    const v = parseFloat(value.replace(/\./g, "").replace(",", "."));
    if (isNaN(v)) return onClose();
    setSaving(true);
    try {
      await fetch("/api/kpi-override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kpiId: kpi.id, value: v }),
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
        className="w-full bg-surface rounded-t-3xl overflow-hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: st.color + "20" }}>
              <Icon size={18} color={st.color} strokeWidth={2} />
            </div>
            <h2 className="text-[16px] font-extrabold text-text-main font-display">{kpi.label}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-background flex items-center justify-center touch-manipulation">
            <X size={16} color="#8A8A8E" strokeWidth={2.5} />
          </button>
        </div>
        <div className="px-5 py-5 space-y-4">
          {kpi.subtitle && (
            <div className="bg-background rounded-xl px-4 py-3">
              <p className="text-[12px] text-text-muted leading-relaxed">{kpi.subtitle}</p>
            </div>
          )}
          <div>
            <label className="text-[12px] font-bold uppercase tracking-wider text-text-muted mb-2 block">
              {kpi.isCurrency ? "Valor (R$)" : "Quantidade"}
            </label>
            <div className="relative">
              {kpi.isCurrency && (
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-bold text-text-muted">R$</span>
              )}
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                className="w-full bg-background rounded-2xl px-4 py-4 text-[22px] font-extrabold text-text-main outline-none border-2 border-transparent focus:border-primary transition-colors font-display"
                style={{ paddingLeft: kpi.isCurrency ? "2.5rem" : "1rem" }}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <motion.button whileTap={{ scale: 0.96 }} onClick={onClose} className="flex-1 h-12 rounded-2xl bg-background flex items-center justify-center touch-manipulation">
              <span className="text-text-muted font-semibold text-[14px]">Cancelar</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={save}
              disabled={saving}
              className="flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 touch-manipulation disabled:opacity-60"
              style={{ backgroundColor: "#CC0000" }}
            >
              <Check size={16} color="white" strokeWidth={2.5} />
              <span className="text-white font-bold text-[14px]">{saving ? "Salvando..." : "Salvar"}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
