"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, ArrowLeft, UserPlus } from "lucide-react";
import { PageHeader, fadeUp, stagger } from "@/components/ui";

type Guest = {
  id: string;
  name: string;
  company: string | null;
  category: string | null;
  phone: string | null;
  inviteISO: string;
  meetingISO: string | null;
  confirmed: boolean;
  attended: boolean;
  interested: boolean;
  becameMember: boolean;
  notes: string | null;
};

export default function ConvidadosClient({ guests }: { guests: Guest[] }) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState(false);

  const total = guests.length;
  const compareceram = guests.filter((g) => g.attended).length;
  const converteram = guests.filter((g) => g.becameMember).length;
  const taxaComp = total > 0 ? Math.round((compareceram / total) * 100) : 0;
  const taxaConv = compareceram > 0 ? Math.round((converteram / compareceram) * 100) : 0;

  async function toggle(g: Guest, field: "confirmed" | "attended" | "becameMember") {
    setBusy(true);
    try {
      await fetch(`/api/guests/${g.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !g[field] }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Convidados"
        subtitle="Convite → comparecimento → conversão"
        right={
          <div className="flex items-center gap-2">
            <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-background flex items-center justify-center touch-manipulation">
              <ArrowLeft size={16} className="text-text-main" strokeWidth={2.5} />
            </button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowNew(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full touch-manipulation"
              style={{ backgroundColor: "#FFF1F1" }}
            >
              <Plus size={14} color="#CC0000" strokeWidth={2.5} />
              <span className="text-[11px] font-bold text-primary">Novo</span>
            </motion.button>
          </div>
        }
      />

      <motion.div initial="hidden" animate="visible" variants={stagger} className="px-4 py-4 space-y-4">
        {/* Estatísticas */}
        <motion.div variants={fadeUp} className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-4 grid grid-cols-4 gap-2">
          {[
            { label: "Convidados", value: `${total}`, color: "#1A1A1A" },
            { label: "Compareceram", value: `${compareceram}`, color: "#16A34A" },
            { label: "Taxa comp.", value: `${taxaComp}%`, color: taxaComp >= 60 ? "#16A34A" : "#D97706" },
            { label: "Conversão", value: `${taxaConv}%`, color: "#8B5CF6" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center">
              <span className="text-[16px] font-extrabold font-display" style={{ color: s.color }}>{s.value}</span>
              <span className="text-[9px] text-text-muted font-semibold text-center leading-tight">{s.label}</span>
            </div>
          ))}
        </motion.div>

        {guests.length === 0 && (
          <motion.div variants={fadeUp} className="bg-surface rounded-2xl border border-gray-100 p-8 flex flex-col items-center text-center">
            <UserPlus size={32} className="text-gray-300 mb-2" />
            <p className="text-[14px] font-bold text-text-main font-display">Nenhum convidado registrado</p>
            <p className="text-[11px] text-text-muted mt-1">Registre convites para acompanhar comparecimento e conversão.</p>
          </motion.div>
        )}

        {guests.map((g) => (
          <motion.div key={g.id} variants={fadeUp} className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-extrabold text-text-main font-display truncate">{g.name}</p>
                <p className="text-[11px] text-text-muted truncate">
                  {[g.company, g.category].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
              <span className="text-[10px] text-text-muted flex-shrink-0">
                Convite: {new Date(g.inviteISO + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Pill active={g.confirmed} label="Confirmou" onClick={() => !busy && toggle(g, "confirmed")} />
              <Pill active={g.attended} label="Compareceu" onClick={() => !busy && toggle(g, "attended")} color="#16A34A" />
              <Pill active={g.becameMember} label="Virou membro 🎉" onClick={() => !busy && toggle(g, "becameMember")} color="#8B5CF6" />
            </div>
            {g.notes && <p className="text-[11px] text-text-muted mt-2">{g.notes}</p>}
          </motion.div>
        ))}
      </motion.div>

      <AnimatePresence>
        {showNew && (
          <NewGuestSheet
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

function Pill({ active, label, onClick, color = "#2563EB" }: { active: boolean; label: string; onClick: () => void; color?: string }) {
  return (
    <button
      onClick={onClick}
      className="px-2.5 py-1.5 rounded-full text-[11px] font-bold touch-manipulation border transition-colors"
      style={{
        backgroundColor: active ? color + "18" : "#F5F5F7",
        borderColor: active ? color : "transparent",
        color: active ? color : "#8A8A8E",
      }}
    >
      {active ? "✓ " : ""}{label}
    </button>
  );
}

function NewGuestSheet({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [category, setCategory] = useState("");
  const [phone, setPhone] = useState("");
  const [inviteISO, setInviteISO] = useState(new Date().toISOString().slice(0, 10));
  const [meetingISO, setMeetingISO] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!name.trim()) return setError("Informe o nome.");
    setSaving(true);
    try {
      const res = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, company, category, phone, inviteISO, meetingISO: meetingISO || null, notes }),
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
          <h2 className="text-[16px] font-extrabold text-text-main font-display">Novo Convidado</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-background flex items-center justify-center touch-manipulation">
            <X size={16} className="text-text-muted" strokeWidth={2.5} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3.5 overflow-y-auto">
          <input className={input} placeholder="Nome *" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <input className={input} placeholder="Empresa" value={company} onChange={(e) => setCompany(e.target.value)} />
            <input className={input} placeholder="Categoria" value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <input className={input} placeholder="Telefone" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-text-muted mb-1 block">Data do convite</label>
              <input type="date" className={input} value={inviteISO} onChange={(e) => setInviteISO(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-text-muted mb-1 block">Reunião escolhida</label>
              <input type="date" className={input} value={meetingISO} onChange={(e) => setMeetingISO(e.target.value)} />
            </div>
          </div>
          <textarea rows={2} className={`${input} resize-none`} placeholder="Observações e próximos passos" value={notes} onChange={(e) => setNotes(e.target.value)} />
          {error && <p className="text-[12px] font-semibold text-primary bg-[#FFF1F1] rounded-xl px-3 py-2">{error}</p>}
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
