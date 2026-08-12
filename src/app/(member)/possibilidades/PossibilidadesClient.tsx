"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, ArrowLeft, Sparkles, Lock, Send, Trash2 } from "lucide-react";
import { PageHeader, fadeUp, stagger } from "@/components/ui";

type Possibility = {
  id: string;
  contactName: string;
  company: string | null;
  notes: string | null;
  status: string;
  updatedAt: string;
};

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  explorando: { label: "Explorando", color: "#8A8A8E", bg: "var(--color-track-soft)" },
  aquecendo: { label: "Aquecendo", color: "#D97706", bg: "var(--tint-amber-bg)" },
  pronta_para_indicar: { label: "Pronta para indicar", color: "#16A34A", bg: "var(--tint-green-bg)" },
  descartada: { label: "Descartada", color: "#6B7280", bg: "var(--color-track-soft)" },
};
const STATUS_ORDER = ["explorando", "aquecendo", "pronta_para_indicar", "descartada"];

export default function PossibilidadesClient({ possibilities }: { possibilities: Possibility[] }) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  async function setStatus(id: string, status: string) {
    setBusy(id);
    try {
      await fetch(`/api/possibilities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    setBusy(id);
    try {
      await fetch(`/api/possibilities/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Criando uma Possibilidade"
        subtitle="Pipeline privado — só você vê"
        right={
          <div className="flex items-center gap-2">
            <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-background flex items-center justify-center touch-manipulation">
              <ArrowLeft size={16} className="text-text-main" strokeWidth={2.5} />
            </button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowNew(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full touch-manipulation"
              style={{ backgroundColor: "var(--tint-red-bg)" }}
            >
              <Plus size={14} color="#CC0000" strokeWidth={2.5} />
              <span className="text-[11px] font-bold text-primary">Nova</span>
            </motion.button>
          </div>
        }
      />

      <motion.div initial="hidden" animate="visible" variants={stagger} className="px-4 py-4 space-y-4">
        <motion.div variants={fadeUp} className="bg-[var(--tint-purple-bg)] border border-[var(--tint-purple-border)] rounded-2xl px-3.5 py-3 flex items-start gap-2">
          <Lock size={14} color="#8B5CF6" className="flex-shrink-0 mt-0.5" />
          <p className="text-[11px] font-semibold text-[#6D28D9] leading-relaxed">
            Notas privadas de pré-referência: um espaço para desenvolver a oportunidade antes de virar uma referência
            oficial. Ninguém mais enxerga — nem o possível indicado, nem outro membro.
          </p>
        </motion.div>

        {possibilities.length === 0 && (
          <motion.div variants={fadeUp} className="bg-surface rounded-2xl border border-gray-100 p-8 flex flex-col items-center text-center">
            <Sparkles size={32} className="text-gray-300 mb-2" />
            <p className="text-[14px] font-bold text-text-main font-display">Nenhuma possibilidade em andamento</p>
            <p className="text-[11px] text-text-muted mt-1">Registre um contato que você está desenvolvendo, antes de virar referência.</p>
          </motion.div>
        )}

        {possibilities.map((p) => {
          const st = STATUS[p.status] ?? STATUS.explorando;
          return (
            <motion.div key={p.id} variants={fadeUp} className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <p className="text-[14px] font-extrabold text-text-main font-display truncate">{p.contactName}</p>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0" style={{ color: st.color, backgroundColor: st.bg }}>
                  {st.label}
                </span>
              </div>
              {p.company && <p className="text-[11px] text-text-muted mb-1.5">{p.company}</p>}
              {p.notes && <p className="text-[12px] text-text-main leading-relaxed mb-2.5">{p.notes}</p>}

              <div className="flex flex-wrap gap-1.5">
                {STATUS_ORDER.filter((s) => s !== p.status).map((s) => (
                  <button
                    key={s}
                    disabled={busy === p.id}
                    onClick={() => setStatus(p.id, s)}
                    className="px-2.5 py-1.5 rounded-full text-[10px] font-bold bg-background text-text-muted touch-manipulation"
                  >
                    {STATUS[s].label}
                  </button>
                ))}
                <button
                  disabled={busy === p.id}
                  onClick={() => remove(p.id)}
                  className="px-2.5 py-1.5 rounded-full text-[10px] font-bold bg-background text-primary touch-manipulation flex items-center gap-1"
                >
                  <Trash2 size={10} /> Remover
                </button>
              </div>

              {p.status === "pronta_para_indicar" && (
                <Link href="/referencias">
                  <motion.div
                    whileTap={{ scale: 0.97 }}
                    className="mt-2.5 h-10 rounded-xl bg-primary flex items-center justify-center gap-1.5 touch-manipulation"
                  >
                    <Send size={13} color="white" />
                    <span className="text-white font-bold text-[12px]">Oficializar como referência</span>
                  </motion.div>
                </Link>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      <AnimatePresence>
        {showNew && (
          <NewPossibilitySheet
            onClose={() => setShowNew(false)}
            onSaved={() => {
              setShowNew(false);
              router.refresh();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function NewPossibilitySheet({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [contactName, setContactName] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!contactName.trim()) return setError("Informe o nome do contato.");
    setSaving(true);
    try {
      const res = await fetch("/api/possibilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactName, company, notes }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Erro ao salvar.");
        return;
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const input =
    "w-full bg-background rounded-xl px-3.5 py-3 text-[13px] font-semibold outline-none border-2 border-transparent focus:border-primary transition-colors";

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
        className="w-full bg-surface rounded-t-3xl overflow-hidden max-h-[92dvh] flex flex-col"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="text-[16px] font-extrabold text-text-main font-display">Nova Possibilidade</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-background flex items-center justify-center touch-manipulation">
            <X size={16} className="text-text-muted" strokeWidth={2.5} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3.5 overflow-y-auto">
          <input className={input} placeholder="Nome do contato *" value={contactName} onChange={(e) => setContactName(e.target.value)} />
          <input className={input} placeholder="Empresa" value={company} onChange={(e) => setCompany(e.target.value)} />
          <textarea rows={3} className={`${input} resize-none`} placeholder="Notas privadas — o que está sendo desenvolvido" value={notes} onChange={(e) => setNotes(e.target.value)} />
          {error && <p className="text-[12px] font-semibold text-primary bg-[var(--tint-red-bg)] rounded-xl px-3 py-2">{error}</p>}
          <div className="flex gap-3 pb-4">
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
