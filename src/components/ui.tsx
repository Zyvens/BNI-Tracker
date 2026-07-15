"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

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

// Anel grande de pontuação (dashboard)
export function ScoreRing({ score, max = 100 }: { score: number; max?: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(score / max, 1);
  const offset = circ - pct * circ;
  const gold = score >= max;
  const stroke = gold ? "#F59E0B" : "#CC0000";
  const track = gold ? "#FEF3C7" : "#F0E0E0";

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
        <circle cx="72" cy="72" r={r} fill="none" stroke={track} strokeWidth="10" />
        <motion.circle
          cx="72"
          cy="72"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{
            filter: gold
              ? "drop-shadow(0 0 6px rgba(245,158,11,0.7))"
              : "drop-shadow(0 0 4px rgba(204,0,0,0.4))",
          }}
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
          style={{
            color: gold ? "#D97706" : "#CC0000",
            textShadow: gold ? "0 0 20px rgba(245,158,11,0.4)" : "0 0 12px rgba(204,0,0,0.2)",
          }}
        >
          {score}
        </span>
        <span className="text-xs font-medium" style={{ color: gold ? "#D97706" : "#8A8A8E" }}>
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
        <div>
          <h1 className="text-[17px] font-extrabold text-text-main font-display">{title}</h1>
          {subtitle && <p className="text-[11px] text-text-muted">{subtitle}</p>}
        </div>
        {right}
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
