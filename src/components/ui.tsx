"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import LogoutButton from "@/components/LogoutButton";
import { scoreSemaforoStatus } from "@/lib/engine";

export const STATUS_COLORS = {
  green: { color: "#22C55E", bg: "#F0FDF4", border: "#D1FAE5", emoji: "🟢", label: "Meta atingida ✓" },
  yellow: { color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", emoji: "🟡", label: "Atenção" },
  red: { color: "#CC0000", bg: "#FFF1F1", border: "#FECACA", emoji: "🔴", label: "Abaixo da meta" },
} as const;

export type StatusKey = keyof typeof STATUS_COLORS;

export function fmtMoney(v: number, compact = false): string {
  if (compact && Math.abs(v) >= 1000) return `R$${(v / 1000).toFixed(1)}k`;
  return `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
}

export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

// Cores do anel por faixa do semáforo (mesma regra de scoreSemaforoStatus): >=100
// ganha o tratamento especial "Clube 100" (dourado, com brilho); 70-99 verde;
// 40-69 amarelo; <40 vermelho — nunca mais um vermelho binário só "abaixo de 100".
const RING_TIERS = {
  gold: { stroke: "#F59E0B", track: "#FEF3C7", text: "#D97706", glow: "rgba(245,158,11,0.7)", textGlow: "rgba(245,158,11,0.4)" },
  green: { stroke: "#22C55E", track: "#DCFCE7", text: "#16A34A", glow: "rgba(34,197,94,0.6)", textGlow: "rgba(34,197,94,0.35)" },
  yellow: { stroke: "#F59E0B", track: "#FEF3C7", text: "#D97706", glow: "rgba(245,158,11,0.6)", textGlow: "rgba(245,158,11,0.35)" },
  red: { stroke: "#CC0000", track: "#F0E0E0", text: "#CC0000", glow: "rgba(204,0,0,0.4)", textGlow: "rgba(204,0,0,0.2)" },
} as const;

// Anel grande de pontuação (dashboard). Segue as mesmas faixas de cor do semáforo
// usadas no resto do app (ver scoreSemaforoStatus em src/lib/engine.ts).
export function ScoreRing({ score, max = 100 }: { score: number; max?: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(score / max, 1);
  const offset = circ - pct * circ;
  const gold = score >= max;
  const tier = RING_TIERS[gold ? "gold" : scoreSemaforoStatus(score)];

  return (
    <div className="relative flex items-center justify-center w-36 h-36">
      {gold && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: `radial-gradient(circle, #F59E0B18 0%, transparent 70%)` }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <svg width="144" height="144" className="-rotate-90">
        <circle cx="72" cy="72" r={r} fill="none" stroke={tier.track} strokeWidth="10" />
        <motion.circle
          cx="72"
          cy="72"
          r={r}
          fill="none"
          stroke={tier.stroke}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 ${gold ? 6 : 4}px ${tier.glow})` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        {gold && (
          <motion.span
            className="text-[13px] mb-0.5"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            🏆
          </motion.span>
        )}
        <span
          className="text-4xl font-extrabold leading-none font-display"
          style={{ color: tier.text, textShadow: `0 0 ${gold ? 20 : 12}px ${tier.textGlow}` }}
        >
          {score}
        </span>
        <span className="text-xs font-medium" style={{ color: gold ? tier.text : "#8A8A8E" }}>
          de {max}
        </span>
      </div>
    </div>
  );
}

// Barra de progresso animada
export function ProgressBar({ pct, color, h = "h-1.5" }: { pct: number; color: string; h?: string }) {
  return (
    <div className={`${h} rounded-full overflow-hidden bg-gray-100`}>
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(pct, 100)}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </div>
  );
}

// Cabeçalho padrão das telas
export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div
      className="bg-surface border-b border-gray-100 sticky top-0 z-30 flex-shrink-0"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="px-4 h-14 flex items-center justify-between">
        <div className="min-w-0">
          <h1 className="text-[17px] font-extrabold text-text-main font-display truncate">{title}</h1>
          {subtitle && <p className="text-[11px] text-text-muted truncate">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {right}
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}

export function Card({
  children,
  className = "",
  accent,
}: {
  children: ReactNode;
  className?: string;
  accent?: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className={`bg-surface rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}
    >
      {accent && <div className="h-1 w-full" style={{ backgroundColor: accent }} />}
      {children}
    </motion.div>
  );
}
