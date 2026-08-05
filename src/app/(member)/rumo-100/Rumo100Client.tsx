"use client";

import { motion } from "framer-motion";
import { Trophy, ShieldPlus } from "lucide-react";
import { PageHeader, ScoreRing, STATUS_COLORS, StatusKey, fmtMoney, fadeUp, stagger } from "@/components/ui";

// Semáforo de urgência por margem em meses: vermelho = zero margem (aja agora),
// amarelo = margem só até o mês seguinte, azul = 3+ meses de margem de segurança.
const URGENCY_STYLE: Record<string, { bg: string; border: string; color: string; dot: string; tag: string }> = {
  critical: { bg: "#FFF1F1", border: "#FECACA", color: "#CC0000", dot: "🔴", tag: "Ação imediata" },
  urgent: { bg: "#FFFBEB", border: "#FDE68A", color: "#D97706", dot: "🟡", tag: "Atenção" },
  watch: { bg: "#EFF6FF", border: "#BFDBFE", color: "#2563EB", dot: "🔵", tag: "Margem segura" },
};

type Action = {
  id: string;
  label: string;
  isCurrency: boolean;
  goal: number;
  currentValue: number;
  urgency: string;
  actionMessage: string;
  safeUntilLabel: string | null;
  dropMonthLabel: string | null;
  daysUntilDrop: number | null;
  neededToRecover: number;
  safetyExtra: number;
};

type Props = {
  score: number;
  targetScore: number;
  safetyMargin: number;
  windowLabel: string;
  statusCard: { status: StatusKey; emoji: string; title: string; subtitle: string };
  ausencias: number;
  atrasos: number;
  actions: Action[];
};

const rank = (u: string) => (u === "critical" ? 0 : u === "urgent" ? 1 : u === "watch" ? 2 : 3);

export default function Rumo100Client(p: Props) {
  const sorted = [...p.actions].sort((a, b) => rank(a.urgency) - rank(b.urgency));
  const safetyActions = p.actions
    .filter((a) => a.safetyExtra > 0)
    .sort((a, b) => a.safetyExtra - b.safetyExtra)
    .slice(0, 3);

  return (
    <div className="flex flex-col">
      <PageHeader title="O que falta para os 100" subtitle={`Janela móvel · ${p.windowLabel}`} />
      <motion.div initial="hidden" animate="visible" variants={stagger} className="px-4 py-4 space-y-4">
        {/* Resumo */}
        <motion.div variants={fadeUp} className="bg-surface rounded-3xl shadow-sm border border-gray-100 p-5 flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <Trophy size={14} color="#D97706" strokeWidth={2.5} />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 font-display">
                Plano Rumo aos {p.targetScore}
              </span>
            </div>
            <p className="text-[13px] text-text-main font-semibold leading-snug">{p.statusCard.title}</p>
            <p className="text-[11px] text-text-muted mt-1">{p.statusCard.subtitle}</p>
          </div>
          <ScoreRing score={p.score} max={p.targetScore} />
        </motion.div>

        {/* Presenças e pontualidade */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
          <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-3.5">
            <p className="text-[11px] font-bold text-text-muted">Ausências</p>
            <p className="text-[22px] font-extrabold font-display" style={{ color: p.ausencias === 0 ? "#22C55E" : p.ausencias <= 2 ? "#F59E0B" : "#CC0000" }}>
              {p.ausencias}
            </p>
            <p className="text-[10px] text-text-muted">
              {p.ausencias === 0 ? "15/15 pts — perfeito!" : `${Math.max(15 - p.ausencias * 5, 0)}/15 pts — cada ausência custa 5 pts`}
            </p>
          </div>
          <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-3.5">
            <p className="text-[11px] font-bold text-text-muted">Atrasos</p>
            <p className="text-[22px] font-extrabold font-display" style={{ color: p.atrasos === 0 ? "#22C55E" : p.atrasos === 1 ? "#F59E0B" : "#CC0000" }}>
              {p.atrasos}
            </p>
            <p className="text-[10px] text-text-muted">
              {p.atrasos === 0 ? "5/5 pts — pontualidade em dia" : p.atrasos === 1 ? "2/5 pts" : "0/5 pts"}
            </p>
          </div>
        </motion.div>

        {/* Plano por indicador */}
        <motion.div variants={fadeUp}>
          <h3 className="text-[12px] font-extrabold uppercase tracking-wider text-text-muted font-display px-1 mb-2">
            Plano de Ação por Indicador
          </h3>
        </motion.div>

        {sorted.map((a) => {
          const st = URGENCY_STYLE[a.urgency];
          const fmt = (n: number) => (a.isCurrency ? fmtMoney(n) : `${n}`);
          return (
            <motion.div
              key={a.id}
              variants={fadeUp}
              className="rounded-2xl border overflow-hidden"
              style={{ backgroundColor: st.bg, borderColor: st.border }}
            >
              <div className="px-4 py-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[14px] flex-shrink-0">{st.dot}</span>
                    <span className="text-[14px] font-extrabold font-display truncate" style={{ color: st.color }}>
                      {a.label}
                    </span>
                    {a.daysUntilDrop !== null && (
                      <span
                        className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: st.color + "22", color: st.color }}
                      >
                        ⏳ {a.dropMonthLabel} · {a.daysUntilDrop}d
                      </span>
                    )}
                  </div>
                  <span className="text-[12px] font-bold flex-shrink-0" style={{ color: st.color }}>
                    {fmt(a.currentValue)} / {fmt(a.goal)}
                  </span>
                </div>
                <p className="text-[12px] leading-relaxed font-semibold mt-1.5" style={{ color: st.color }}>
                  {a.actionMessage}
                </p>
              </div>
            </motion.div>
          );
        })}

        {/* Margem de segurança */}
        {safetyActions.length > 0 && (
          <motion.div variants={fadeUp} className="bg-surface rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-green-400 to-emerald-500" />
            <div className="px-4 py-3.5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center">
                  <ShieldPlus size={16} color="#22C55E" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[13px] font-extrabold text-text-main font-display">Criar margem de segurança</p>
                  <p className="text-[10px] text-text-muted">
                    Para folga de ~{p.safetyMargin} pontos, faça estas ações adicionais:
                  </p>
                </div>
              </div>
              <ul className="space-y-1.5">
                {safetyActions.map((a) => (
                  <li key={a.id} className="flex items-center gap-2 text-[12px] font-semibold text-text-main">
                    <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
                    Registre mais {a.isCurrency ? fmtMoney(a.safetyExtra) : a.safetyExtra} em {a.label}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
