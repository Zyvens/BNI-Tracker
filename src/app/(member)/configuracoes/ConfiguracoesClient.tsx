"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Sun, Moon, Sparkle, Trophy, ChevronRight } from "lucide-react";
import { PageHeader, fadeUp, stagger } from "@/components/ui";
import InstallPwaButton from "@/components/InstallPwaButton";
import PushSubscribeToggle from "@/components/PushSubscribeToggle";

const THEMES = [
  {
    id: "light",
    label: "Claro",
    description: "Fundo branco, alto contraste — padrão do app",
    icon: Sun,
    preview: { bg: "#F5F5F7", surface: "#FFFFFF", accent: "#CC0000" },
  },
  {
    id: "dark",
    label: "Escuro",
    description: "Fundo neutro escuro, mais confortável à noite",
    icon: Moon,
    preview: { bg: "#0C0C0E", surface: "#18181B", accent: "#CC0000" },
  },
  {
    id: "blue-moon",
    label: "Blue Moon",
    description: "Escuro com tom azulado, visual mais suave",
    icon: Sparkle,
    preview: { bg: "#0A1220", surface: "#111D33", accent: "#5B8DEF" },
  },
] as const;

export default function ConfiguracoesClient({
  name,
  currentTheme,
  showInRanking,
}: {
  name: string;
  currentTheme: string;
  showInRanking: boolean;
}) {
  const router = useRouter();
  const [theme, setThemeState] = useState(currentTheme);
  const [ranking, setRanking] = useState(showInRanking);
  const [savingRanking, setSavingRanking] = useState(false);

  function applyTheme(id: string) {
    setThemeState(id);
    document.documentElement.setAttribute("data-theme", id);
    document.cookie = `theme=${id}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  }

  async function toggleRanking() {
    const next = !ranking;
    setRanking(next);
    setSavingRanking(true);
    try {
      await fetch("/api/ranking/optin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      router.refresh();
    } finally {
      setSavingRanking(false);
    }
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Configurações"
        subtitle={name}
        right={
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-background flex items-center justify-center touch-manipulation">
            <ArrowLeft size={16} className="text-text-main" strokeWidth={2.5} />
          </button>
        }
      />

      <motion.div initial="hidden" animate="visible" variants={stagger} className="px-4 py-4 space-y-4">
        <motion.div variants={fadeUp}>
          <InstallPwaButton />
        </motion.div>

        <motion.div variants={fadeUp}>
          <PushSubscribeToggle />
        </motion.div>

        <motion.div variants={fadeUp}>
          <h3 className="text-[12px] font-extrabold uppercase tracking-wider text-text-muted font-display px-1 mb-2">
            Aparência
          </h3>
        </motion.div>

        {THEMES.map((t) => {
          const Icon = t.icon;
          const active = theme === t.id;
          return (
            <motion.button
              key={t.id}
              variants={fadeUp}
              whileTap={{ scale: 0.98 }}
              onClick={() => applyTheme(t.id)}
              className="w-full bg-surface rounded-2xl shadow-sm border p-4 flex items-center gap-3.5 touch-manipulation text-left"
              style={{ borderColor: active ? "#CC0000" : "var(--color-border)", borderWidth: active ? 2 : 1 }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center relative overflow-hidden border"
                style={{ backgroundColor: t.preview.bg, borderColor: t.preview.surface }}
              >
                <div className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-lg" style={{ backgroundColor: t.preview.surface }} />
                <Icon size={18} color={t.preview.accent} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-extrabold text-text-main font-display">{t.label}</p>
                <p className="text-[11px] text-text-muted mt-0.5 leading-snug">{t.description}</p>
              </div>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: active ? "#CC0000" : "var(--color-track)" }}
              >
                {active && <Check size={13} color="white" strokeWidth={3} />}
              </div>
            </motion.button>
          );
        })}

        <motion.p variants={fadeUp} className="text-[10px] text-text-muted px-1 leading-relaxed">
          A preferência fica salva neste aparelho e se aplica sempre que você acessar o BNI Tracker.
        </motion.p>

        <motion.div variants={fadeUp}>
          <h3 className="text-[12px] font-extrabold uppercase tracking-wider text-text-muted font-display px-1 mb-2 mt-2">
            Capítulo
          </h3>
        </motion.div>

        <motion.div variants={fadeUp} className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-4">
          <button
            type="button"
            onClick={toggleRanking}
            disabled={savingRanking}
            className="flex items-center justify-between w-full touch-manipulation disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--tint-amber-bg)] flex items-center justify-center flex-shrink-0">
                <Trophy size={17} color="#D97706" strokeWidth={2} />
              </div>
              <div className="text-left">
                <p className="text-[13px] font-extrabold text-text-main font-display">Aparecer no ranking</p>
                <p className="text-[10.5px] text-text-muted leading-snug mt-0.5">
                  Sua pontuação fica visível aos outros membros no placar do capítulo
                </p>
              </div>
            </div>
            <div
              className="w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ml-3"
              style={{ backgroundColor: ranking ? "#22C55E" : "var(--color-track)" }}
            >
              <motion.div
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
                animate={{ left: ranking ? 22 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            </div>
          </button>
          {ranking && (
            <Link
              href="/ranking"
              className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 touch-manipulation"
            >
              <span className="text-[12px] font-bold" style={{ color: "#D97706" }}>
                Ver o placar do capítulo
              </span>
              <ChevronRight size={15} color="#D97706" strokeWidth={2.5} />
            </Link>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
