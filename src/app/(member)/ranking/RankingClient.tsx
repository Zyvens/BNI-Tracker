"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy, Medal } from "lucide-react";
import { PageHeader, fadeUp, stagger } from "@/components/ui";

type Row = { id: string; name: string; score: number; targetScore: number };

const MEDAL_COLOR = ["#F59E0B", "#9CA3AF", "#B45309"];

export default function RankingClient({ rows, meId, optedIn }: { rows: Row[]; meId: string; optedIn: boolean }) {
  const router = useRouter();

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Ranking do Capítulo"
        subtitle={`${rows.length} membro(s) participando`}
        right={
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-background flex items-center justify-center touch-manipulation">
            <ArrowLeft size={16} className="text-text-main" strokeWidth={2.5} />
          </button>
        }
      />

      <motion.div initial="hidden" animate="visible" variants={stagger} className="px-4 py-4 space-y-3">
        {!optedIn && (
          <motion.div variants={fadeUp}>
            <Link href="/configuracoes">
              <div className="rounded-2xl p-4 border flex items-center gap-3" style={{ backgroundColor: "var(--tint-amber-bg)", borderColor: "var(--tint-amber-border)" }}>
                <Trophy size={18} color="#D97706" strokeWidth={2.2} />
                <p className="text-[12px] font-semibold" style={{ color: "#D97706" }}>
                  Você não está no ranking. Ative em Configurações para aparecer aqui.
                </p>
              </div>
            </Link>
          </motion.div>
        )}

        {rows.length === 0 && (
          <motion.div variants={fadeUp} className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <p className="text-[13px] text-text-muted">Ninguém participa do ranking ainda.</p>
          </motion.div>
        )}

        {rows.map((r, i) => {
          const isMe = r.id === meId;
          const gold = r.score >= r.targetScore;
          return (
            <motion.div
              key={r.id}
              variants={fadeUp}
              className="bg-surface rounded-2xl shadow-sm border p-3.5 flex items-center gap-3"
              style={{ borderColor: isMe ? "#CC0000" : "var(--color-border)", borderWidth: isMe ? 2 : 1 }}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-extrabold font-display text-[13px]"
                style={{
                  backgroundColor: i < 3 ? MEDAL_COLOR[i] + "22" : "var(--color-track-soft)",
                  color: i < 3 ? MEDAL_COLOR[i] : "var(--color-text-muted)",
                }}
              >
                {i < 3 ? <Medal size={16} color={MEDAL_COLOR[i]} strokeWidth={2.2} /> : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-extrabold text-text-main font-display truncate">
                  {r.name}
                  {isMe && <span className="text-text-muted font-semibold"> (você)</span>}
                </p>
              </div>
              <span
                className="text-[15px] font-extrabold font-display flex-shrink-0"
                style={{ color: gold ? "#D97706" : "var(--color-text-main)" }}
              >
                {gold ? "🏆 " : ""}
                {r.score} pts
              </span>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
