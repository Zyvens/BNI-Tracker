"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap,
  HeartPulse,
  AlertTriangle,
  Lightbulb,
  Send,
  UserPlus,
  Users,
  MessageSquareQuote,
  Banknote,
} from "lucide-react";
import { PageHeader, ProgressBar, STATUS_COLORS, StatusKey, fmtMoney, fadeUp, stagger } from "@/components/ui";

const KPI_ICONS: Record<string, any> = {
  refDadas: Send,
  convidados: UserPlus,
  reunioes1a1: Users,
  uegs: Lightbulb,
  testemunhos: MessageSquareQuote,
  opnf: Banknote,
};

type Kpi = {
  id: string;
  label: string;
  metaLabel: string;
  goal: number;
  current: number;
  status: StatusKey;
  pct: number;
  dica: string;
  isCurrency: boolean;
};

type Props = {
  windowLabel: string;
  windowStart: string;
  windowEnd: string;
  greens: number;
  yellows: number;
  reds: number;
  kpis: Kpi[];
};

export default function SaudeDmiClient(p: Props) {
  const overall: StatusKey = p.reds > 0 ? "red" : p.yellows > 0 ? "yellow" : "green";
  const headline = {
    red: {
      label: "Atenção Necessária",
      desc: `${p.reds} indicador${p.reds > 1 ? "es" : ""} abaixo da meta — ação recomendada agora.`,
    },
    yellow: {
      label: "Quase Lá",
      desc: `${p.yellows} indicador${p.yellows > 1 ? "es" : ""} próximo${p.yellows > 1 ? "s" : ""} da meta — mantenha o ritmo.`,
    },
    green: {
      label: "Você está no Clube 100!",
      desc: "Todos os indicadores dentro ou acima da meta. Excelente desempenho!",
    },
  }[overall];
  const st = STATUS_COLORS[overall];
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Saúde do DMI"
        subtitle={`Janela móvel · ${p.windowLabel}`}
        right={
          <Link href="/registro-semana">
            <motion.div
              whileTap={{ scale: 0.9 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full touch-manipulation"
              style={{ backgroundColor: "var(--tint-red-bg)" }}
            >
              <Zap size={14} color="#CC0000" strokeWidth={2.5} />
              <span className="text-[11px] font-bold text-primary">Registrar</span>
            </motion.div>
          </Link>
        }
      />

      <motion.div initial="hidden" animate="visible" variants={stagger} className="px-4 py-4 space-y-4">
        {/* Card geral */}
        <motion.div
          variants={fadeUp}
          className="bg-surface rounded-3xl shadow-sm border overflow-hidden"
          style={{ borderColor: p.reds > 0 ? "var(--tint-red-border)" : "var(--color-border-strong)" }}
        >
          <div
            className="h-2 w-full"
            style={{
              background:
                p.reds > 0 ? "#CC0000" : "linear-gradient(90deg, #CC0000 0%, #F59E0B 50%, #22C55E 100%)",
            }}
          />
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: st.bg }}>
                <HeartPulse size={24} color={st.color} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[14px]">{st.emoji}</span>
                  <h2 className="text-[17px] font-extrabold font-display" style={{ color: st.color }}>
                    {headline.label}
                  </h2>
                </div>
                <p className="text-[11.5px] text-text-muted mt-0.5">{headline.desc}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["green", "yellow", "red"] as StatusKey[]).map((s) => {
                const c = STATUS_COLORS[s];
                const count = s === "green" ? p.greens : s === "yellow" ? p.yellows : p.reds;
                return (
                  <div key={s} className="rounded-xl py-2.5 flex flex-col items-center" style={{ backgroundColor: c.bg }}>
                    <span className="text-[18px] font-extrabold font-display" style={{ color: c.color }}>
                      {count}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: c.color }}>
                      {s === "green" ? "No verde" : s === "yellow" ? "Atenção" : "Crítico"}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-text-muted mt-3">
              Janela móvel de 6 meses: {fmtDate(p.windowStart)} — {fmtDate(p.windowEnd)}
            </p>
          </div>
        </motion.div>

        {/* Cards detalhados por KPI */}
        {p.kpis.map((k) => {
          const Icon = KPI_ICONS[k.id] ?? Send;
          const c = STATUS_COLORS[k.status];
          const critical = k.status === "red";
          const cur = k.isCurrency ? fmtMoney(k.current) : `${k.current}`;
          const goal = k.isCurrency ? fmtMoney(k.goal) : `${k.goal}`;
          const missing = Math.max(k.goal - k.current, 0);
          return (
            <motion.div
              key={k.id}
              variants={fadeUp}
              className="rounded-2xl shadow-sm border overflow-hidden"
              style={{
                backgroundColor: critical ? "var(--tint-red-bg)" : "var(--color-surface)",
                borderColor: critical ? "var(--tint-red-border)" : "var(--color-border-strong)",
              }}
            >
              <div className="h-1 w-full" style={{ backgroundColor: critical ? "#CC0000" : c.color + "66" }} />
              <div className="px-4 pt-4 pb-4 space-y-3.5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: critical ? "var(--tint-red-bg-strong)" : c.bg }}
                  >
                    <Icon size={20} color={c.color} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-extrabold font-display" style={{ color: critical ? "#CC0000" : "var(--color-text-main)" }}>
                      {k.label}
                    </h3>
                    <p className="text-[11px] text-text-muted">{k.metaLabel}</p>
                  </div>
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{ backgroundColor: critical ? "var(--tint-red-bg-strong)" : c.bg }}
                  >
                    <span className="text-[12px]">{c.emoji}</span>
                    <span className="text-[13px] font-extrabold font-display" style={{ color: c.color }}>
                      {cur}
                    </span>
                    <span className="text-[11px] text-text-muted">/ {goal}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-text-main">
                      {cur} / {goal}
                    </span>
                    <span className="text-[11px] font-semibold" style={{ color: c.color }}>
                      {k.pct}%
                    </span>
                  </div>
                  <ProgressBar pct={k.pct} color={c.color} h="h-3" />
                  {missing > 0 && (
                    <p className="text-[11px] text-text-muted">
                      Faltam{" "}
                      <strong style={{ color: c.color }}>{k.isCurrency ? fmtMoney(missing) : missing}</strong>{" "}
                      para a meta
                    </p>
                  )}
                </div>

                <div
                  className="rounded-xl px-3 py-2.5 flex items-start gap-2"
                  style={{ backgroundColor: critical ? "var(--tint-red-bg-strong)" : c.bg }}
                >
                  {critical ? (
                    <AlertTriangle size={14} color="#CC0000" strokeWidth={2} className="flex-shrink-0 mt-0.5" />
                  ) : (
                    <Lightbulb size={14} color={c.color} strokeWidth={2} className="flex-shrink-0 mt-0.5" />
                  )}
                  <p className="text-[11px] leading-relaxed font-semibold" style={{ color: c.color }}>
                    {k.dica}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
