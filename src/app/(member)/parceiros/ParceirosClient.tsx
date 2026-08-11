"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, ArrowLeft, Handshake, CheckCircle2, MoreVertical, Trash2 } from "lucide-react";
import { PageHeader, fmtMoney, fadeUp, stagger } from "@/components/ui";

type Partner = {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  notes: string | null;
  active: boolean;
  lastThankedAt: string | null;
  stats: { count: number; fechadas: number; valor: number };
};

function thankedThisMonth(iso: string | null) {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export default function ParceirosClient({ partners }: { partners: Partner[] }) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const totalValor = partners.reduce((s, p) => s + p.stats.valor, 0);

  async function action(id: string, body: Record<string, unknown>) {
    setBusy(id);
    try {
      await fetch(`/api/recurring-partners/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      router.refresh();
    } finally {
      setBusy(null);
      setMenuFor(null);
    }
  }

  async function remove(id: string) {
    setBusy(id);
    try {
      await fetch(`/api/recurring-partners/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(null);
      setMenuFor(null);
    }
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Parceiros Recorrentes"
        subtitle="Quem manda indicação com frequência"
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
        <motion.div variants={fadeUp} className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-4 grid grid-cols-3 gap-2">
          {[
            { label: "Parceiros ativos", value: `${partners.filter((p) => p.active).length}`, color: "var(--color-text-main)" },
            { label: "Referências recebidas", value: `${partners.reduce((s, p) => s + p.stats.count, 0)}`, color: "#2563EB" },
            { label: "Valor gerado", value: fmtMoney(totalValor, true), color: "#16A34A" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center">
              <span className="text-[15px] font-extrabold font-display" style={{ color: s.color }}>{s.value}</span>
              <span className="text-[9px] text-text-muted font-semibold text-center leading-tight">{s.label}</span>
            </div>
          ))}
        </motion.div>

        {partners.length === 0 && (
          <motion.div variants={fadeUp} className="bg-surface rounded-2xl border border-gray-100 p-8 flex flex-col items-center text-center">
            <Handshake size={32} className="text-gray-300 mb-2" />
            <p className="text-[14px] font-bold text-text-main font-display">Nenhum parceiro recorrente</p>
            <p className="text-[11px] text-text-muted mt-1">
              Marque contatos externos que indicam negócio com frequência (ex: alguém de outro grupo).
            </p>
          </motion.div>
        )}

        {partners.map((p) => {
          const thanked = thankedThisMonth(p.lastThankedAt);
          return (
            <motion.div key={p.id} variants={fadeUp} className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-4" style={{ opacity: p.active ? 1 : 0.55 }}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-extrabold text-text-main font-display truncate">{p.name}</p>
                  <p className="text-[11px] text-text-muted truncate">{p.company || "Contato externo"}</p>
                </div>
                <div className="relative flex-shrink-0">
                  <button onClick={() => setMenuFor(menuFor === p.id ? null : p.id)} className="w-8 h-8 rounded-full flex items-center justify-center touch-manipulation">
                    <MoreVertical size={16} className="text-text-muted" />
                  </button>
                  {menuFor === p.id && (
                    <div className="absolute right-0 top-9 z-10 bg-surface rounded-xl shadow-lg border border-gray-100 py-1 w-40">
                      <button onClick={() => action(p.id, { action: "toggle" })} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-text-main hover:bg-background">
                        {p.active ? "Marcar inativo" : "Marcar ativo"}
                      </button>
                      <button onClick={() => remove(p.id)} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-primary hover:bg-background flex items-center gap-1.5">
                        <Trash2 size={12} /> Remover
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 mt-2.5">
                <span className="text-[11px] font-semibold text-text-muted">
                  {p.stats.count} referência{p.stats.count === 1 ? "" : "s"} · {p.stats.fechadas} fechada{p.stats.fechadas === 1 ? "" : "s"}
                </span>
                {p.stats.valor > 0 && (
                  <span className="text-[11px] font-extrabold font-display" style={{ color: "#16A34A" }}>
                    {fmtMoney(p.stats.valor, true)}
                  </span>
                )}
              </div>

              <button
                disabled={busy === p.id}
                onClick={() => action(p.id, { action: "thanked" })}
                className="w-full h-10 rounded-xl mt-3 flex items-center justify-center gap-1.5 touch-manipulation border transition-colors"
                style={{
                  backgroundColor: thanked ? "#F0FDF4" : "#FFF1F1",
                  borderColor: thanked ? "#BBF7D0" : "#FECACA",
                }}
              >
                <CheckCircle2 size={14} color={thanked ? "#16A34A" : "#CC0000"} />
                <span className="text-[12px] font-bold" style={{ color: thanked ? "#16A34A" : "#CC0000" }}>
                  {thanked ? "Agradecido este mês ✓" : "Marcar como agradecido"}
                </span>
              </button>
            </motion.div>
          );
        })}
      </motion.div>

      <AnimatePresence>
        {showNew && (
          <NewPartnerSheet
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

function NewPartnerSheet({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!name.trim()) return setError("Informe o nome do parceiro.");
    setSaving(true);
    try {
      const res = await fetch("/api/recurring-partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, company, phone, notes }),
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
          <h2 className="text-[16px] font-extrabold text-text-main font-display">Novo Parceiro Recorrente</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-background flex items-center justify-center touch-manipulation">
            <X size={16} className="text-text-muted" strokeWidth={2.5} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3.5 overflow-y-auto">
          <p className="text-[11px] text-text-muted leading-relaxed">
            Use o mesmo nome usado como &ldquo;quem enviou&rdquo; nas suas referências, para o histórico de valor ser calculado automaticamente.
          </p>
          <input className={input} placeholder="Nome *" value={name} onChange={(e) => setName(e.target.value)} />
          <input className={input} placeholder="De onde é (ex: outro grupo de networking)" value={company} onChange={(e) => setCompany(e.target.value)} />
          <input className={input} placeholder="Telefone" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <textarea rows={2} className={`${input} resize-none`} placeholder="Observações" value={notes} onChange={(e) => setNotes(e.target.value)} />
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
