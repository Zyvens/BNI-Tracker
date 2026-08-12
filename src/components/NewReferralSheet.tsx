"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export default function NewReferralSheet({
  members,
  defaultDirecao,
  onClose,
  onSaved,
}: {
  members: { id: string; name: string }[];
  defaultDirecao: "dada" | "recebida";
  onClose: () => void;
  onSaved: () => void;
}) {
  const [direcao, setDirecao] = useState<"dada" | "recebida">(defaultDirecao);
  const [contactName, setContactName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [otherMemberId, setOtherMemberId] = useState("");
  const [otherName, setOtherName] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [origem, setOrigem] = useState("referencia_direta");
  const [dataISO, setDataISO] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!contactName.trim()) return setError("Informe o nome do contato.");
    setSaving(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        direcao,
        contactName,
        company,
        phone,
        estimatedValue: parseFloat(estimatedValue.replace(",", ".")) || 0,
        origem,
        dataISO,
        notes,
      };
      if (direcao === "dada") {
        if (otherMemberId) body.receiverId = otherMemberId;
        else body.receiverName = otherName;
      } else {
        if (otherMemberId) body.giverId = otherMemberId;
        else body.giverName = otherName;
      }
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
          <h2 className="text-[16px] font-extrabold text-text-main font-display">Nova Referência</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-background flex items-center justify-center touch-manipulation">
            <X size={16} className="text-text-muted" strokeWidth={2.5} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3.5 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
            {(["recebida", "dada"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDirecao(d)}
                className="h-11 rounded-xl text-[12px] font-bold touch-manipulation border-2 transition-colors"
                style={{
                  backgroundColor: direcao === d ? "var(--tint-red-bg)" : "var(--color-track-soft)",
                  borderColor: direcao === d ? "#CC0000" : "transparent",
                  color: direcao === d ? "#CC0000" : "#8A8A8E",
                }}
              >
                {d === "recebida" ? "Recebi uma referência" : "Dei uma referência"}
              </button>
            ))}
          </div>

          <Field label="Contato indicado *">
            <input className={inputCls} value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Nome do possível cliente" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Empresa">
              <input className={inputCls} value={company} onChange={(e) => setCompany(e.target.value)} />
            </Field>
            <Field label="Telefone">
              <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
            </Field>
          </div>

          <Field label={direcao === "recebida" ? "Quem enviou (membro)" : "Membro beneficiado"}>
            <select className={inputCls} value={otherMemberId} onChange={(e) => setOtherMemberId(e.target.value)}>
              <option value="">— Fora da equipe —</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </Field>
          {!otherMemberId && (
            <Field label={direcao === "recebida" ? "Nome de quem enviou" : "Nome do beneficiado"}>
              <input className={inputCls} value={otherName} onChange={(e) => setOtherName(e.target.value)} />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor estimado (R$)">
              <input className={inputCls} value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} placeholder="0,00" inputMode="decimal" />
            </Field>
            <Field label="Data">
              <input type="date" className={inputCls} value={dataISO} onChange={(e) => setDataISO(e.target.value)} />
            </Field>
          </div>

          <Field label="Origem">
            <select className={inputCls} value={origem} onChange={(e) => setOrigem(e.target.value)}>
              <option value="referencia_direta">Referência Direta</option>
              <option value="parceria_estrategica">Parceria Estratégica</option>
              <option value="indicacao_recorrente">Indicação Recorrente</option>
              <option value="negocio_compartilhado">Negócio Compartilhado</option>
              <option value="clube_permuta">Clube de Permuta</option>
              <option value="cliente_proprio">Cliente Próprio (networking)</option>
            </select>
          </Field>

          <Field label="Observações">
            <textarea rows={2} className={`${inputCls} resize-none`} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>

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

const inputCls =
  "w-full bg-background rounded-xl px-3.5 py-3 text-[13px] font-semibold outline-none border-2 border-transparent focus:border-primary transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}
