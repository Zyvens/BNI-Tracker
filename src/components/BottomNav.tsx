"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutGrid,
  HeartPulse,
  Activity,
  CalendarDays,
  BrainCircuit,
} from "lucide-react";

const TABS = [
  { path: "/", label: "Dashboard", icon: LayoutGrid },
  { path: "/saude-dmi", label: "Saúde DMI", icon: HeartPulse },
  { path: "/feed", label: "Feed", icon: Activity },
  { path: "/semanas", label: "Semanas", icon: CalendarDays },
  { path: "/analise", label: "Análise", icon: BrainCircuit },
];

export default function BottomNav({ score, max = 100 }: { score?: number; max?: number }) {
  const pathname = usePathname();
  const r = 14;
  const circ = 2 * Math.PI * r;
  const pct = score !== undefined ? Math.min(score / max, 1) : 0;
  const offset = circ - pct * circ;
  const gold = score !== undefined && score >= max;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-surface border-t border-gray-100 z-40"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center h-14">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active =
            tab.path === "/" ? pathname === "/" : pathname.startsWith(tab.path);
          return (
            <Link
              key={tab.path}
              href={tab.path}
              className="flex flex-col items-center justify-center flex-1 h-full touch-manipulation"
            >
              <motion.div
                className="flex flex-col items-center gap-0.5 relative"
                whileTap={{ scale: 0.88 }}
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.2 : 1.7}
                  color={active ? "#CC0000" : "#8A8A8E"}
                />
                <span
                  className="text-[9px] font-medium font-body"
                  style={{ color: active ? "#CC0000" : "#8A8A8E" }}
                >
                  {tab.label}
                </span>
                {active && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute -top-px h-0.5 w-8 rounded-full bg-primary"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
        {score !== undefined && (
          <Link
            href="/rumo-100"
            className="flex-shrink-0 flex items-center justify-center w-14 h-full border-l border-gray-100"
          >
            <div className="relative flex items-center justify-center w-10 h-10">
              <svg width="40" height="40" className="-rotate-90">
                <circle
                  cx="20"
                  cy="20"
                  r={r}
                  fill="none"
                  stroke={gold ? "#FEF3C7" : "#F0E0E0"}
                  strokeWidth="3.5"
                />
                <motion.circle
                  cx="20"
                  cy="20"
                  r={r}
                  fill="none"
                  stroke={gold ? "#F59E0B" : "#CC0000"}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  initial={{ strokeDashoffset: circ }}
                  animate={{ strokeDashoffset: offset }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  style={{
                    filter: gold
                      ? "drop-shadow(0 0 3px rgba(245,158,11,0.6))"
                      : "drop-shadow(0 0 2px rgba(204,0,0,0.35))",
                  }}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                {gold ? (
                  <span className="text-[9px] leading-none">🏆</span>
                ) : (
                  <span className="text-[10px] font-extrabold leading-none font-display text-primary">
                    {score}
                  </span>
                )}
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
