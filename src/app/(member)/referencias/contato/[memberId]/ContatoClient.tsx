"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Inbox, MessageSquareQuote, Plus, X } from "lucide-react";
import { PageHeader, fadeUp, stagger } from "@/components/ui";
import { STATUS_LABEL } from "../../ReferenciasClient";

type RefRow = { id: string; contactName: string; dataISO: string; status: string; origem?: string };

type Props = {
  other: { id: string; name: string; company: string | null; category: string | null };
  stats: {
    givenByMeCount: number;
    closedByThem: number;
    givenByThemCount: number;
    closedByMe: number;
    indirectFromThemCount: number;
    indirectClosedByMe: number;
    testemunhosParaEle: number;
    testemunhosParaMim: number;
  };
  refsGivenByMe: RefRow[];
  refsGivenByThem: RefRow[];
};

export default function ContatoClient({ other, stats, refsGivenByMe, refsGivenByThem }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"dadas" | "recebidas">("dadas");
  const [showTestimonial, setShowTestimonial] = useState<null | "given" | "received">(null);

  const list = tab === "dadas" ? refsGivenByMe : refsGivenByThem;

  return (
    <div className="flex flex-col">
      <PageHeader
        title={other.name}
        subtitle={other.company ?? other.category ?? "Histórico de relacionamento"}
        right={
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-background flex items-center justify-center touch-manipulation">
            <ArrowLeft size={16} className="text-text-main" strokeWidth={2.5} />
          </button>
        }
      />

      <motion.div initial="hidden" animate="visible" variants={stagger} className="px-4 py-4 space-y-4">
        {/* Resumo bilateral */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
          <StatCard icon={<Send size={14} color="#CC0000" />} label="Você deu a ele(a)" value={stats.givenByMeCount} sub={`${stats.closedByThem} fechada(s)`} />
          <StatCard icon={<Inbox size={14} color="#2563EB" />} label="Ele(a) deu a você" value={stats.givenByThemCount} sub={`${stats.closedByMe} fechada(s)`} />
        </motion.div>

        <motion.div variants={fadeUp} className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">Referências &ldquo;das costas&rdquo; (indiretas)</p>
          <p className="text-[13px] font-semibold text-text-main">
            {other.name} deu <strong>{stats.indirectFromThemCount}</strong> referência(s) indireta(s), das quais você fechou{" "}
            <strong>{stats.indirectClosedByMe}</strong>.
          </p>
        </motion.div>

        {/* Testemunhos bilaterais */}
        <motion.div variants={fadeUp} className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-[#F5F3FF] flex items-center justify-center">
              <MessageSquareQuote size={15} color="#8B5CF6" />
            </div>
            <p className="text-[13px] font-extrabold text-text-main font-display">Testemunhos</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col items-center bg-background rounded-xl py-3">
              <span className="text-[18px] font-extrabold font-display text-text-main">{stats.testemunhosParaEle}</span>
              <span className="text-[10px] text-text-muted font-semibold text-center">Você → {other.name.split(" ")[0]}</span>
              <button onClick={() => setShowTestimonial("given")} className="mt-1.5 text-[10px] font-bold text-primary flex items-center gap-0.5 touch-manipulation">
                <Plus size={10} /> Registrar
              </button>
            </div>
            <div className="flex flex-col items-center bg-background rounded-xl py-3">
              <span className="text-[18px] font-extrabold font-display text-text-main">{stats.testemunhosParaMim}</span>
              <span className="text-[10px] text-text-muted font-semibold text-center">{other.name.split(" ")[0]} → Você</span>
              <button onClick={() => setShowTestimonial("received")} className="mt-1.5 text-[10px] font-bold text-primary flex items-center gap-0.5 touch-manipulation">
                <Plus size={10} /> Registrar
              </button>
            </div>
          </div>
        </motion.div>

        {/* Lista de referências */}
        <motion.div variants={fadeUp} className="bg-surface rounded-2xl p-1 flex border border-gray-100">
          {(["dadas", "recebidas"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 h-10 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 touch-manipulation transition-colors"
              style={{ backgroundColor: tab === t ? "#CC0000" : "transparent", color: tab === t ? "#FFFFFF" : "#8A8A8E" }}
            >
              {t === "dadas" ? `Você deu (${refsGivenByMe.length})` : `Você recebeu (${refsGivenByThem.length})`}
            </button>
          ))}
        </motion.div>

        <div className="space-y-2.5">
          {list.length === 0 && <p className="text-[11px] text-text-muted text-center py-4">Nenhuma referência ainda.</p>}
          {list.map((r) => {
            const st = STATUS_LABEL[r.status] ?? STATUS_LABEL.recebida;
            return (
              <div key={r.id} className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-3.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-text-main truncate">{r.contactName}</p>
                  <p className="text-[10px] text-text-muted">{new Date(r.dataISO + "T00:00:00").toLocaleDateString("pt-BR")}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0" style={{ color: st.color, backgroundColor: st.bg }}>
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      <AnimatePresence>
        {showTestimonial && (
          <TestimonialSheet
            direction={showTestimonial}
            otherId={other.id}
            otherName={other.name}
            onClose={() => setShowTestimonial(null)}
            onSaved={() => {
              setShowTestimonial(null);
              router.refresh();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number; sub: string }) {
  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-3.5">
      <div className="flex items-center gap-1.5 mb-1">{icon}<span className="text-[10px] font-bold text-text-muted uppercase tracking-wide">{label}</span></div>
      <p className="text-[22px] font-extrabold font-display text-text-main">{value}</p>
      <p className="text-[10px] text-text-muted">{sub}</p>
    </div>
  );
}

function TestimonialSheet({
  direction,
  otherId,
  otherName,
  onClose,
  onSaved,
}: {
  direction: "given" | "received";
  otherId: string;
  otherName: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [dataISO, setDataISO] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toId: otherId, direction, dataISO, notes }),
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
          <h2 className="text-[16px] font-extrabold text-text-main font-display">
            {direction === "given" ? `Testemunho para ${otherName}` : `Testemunho de ${otherName}`}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-background flex items-center justify-center touch-manipulation">
            <X size={16} className="text-text-muted" strokeWidth={2.5} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3.5">
          <input type="date" className="w-full bg-background rounded-xl px-3.5 py-3 text-[13px] font-semibold outline-none" value={dataISO} onChange={(e) => setDataISO(e.target.value)} />
          <textarea
            rows={2}
            className="w-full bg-background rounded-xl px-3.5 py-3 text-[13px] font-medium outline-none border-2 border-transparent focus:border-primary transition-colors resize-none"
            placeholder="Observações (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex gap-3 pb-3">
            <motion.button whileTap={{ scale: 0.96 }} onClick={onClose} className="flex-1 h-12 rounded-2xl bg-background flex items-center justify-center touch-manipulation">
              <span className="text-text-muted font-semibold text-[14px]">Cancelar</span>
            </motion.button>
            <motion.button whileTap={{ scale: 0.96 }} onClick={submit} disabled={saving} className="flex-1 h-12 rounded-2xl bg-primary flex items-center justify-center touch-manipulation disabled:opacity-60">
              <span className="text-white font-bold text-[14px]">{saving ? "Salvando..." : "Salvar"}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
