"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, UserPlus, Send, Inbox, ChevronRight } from "lucide-react";
import { PageHeader, fmtMoney, fadeUp, stagger } from "@/components/ui";

export const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  enviada: { label: "Enviada", color: "#2563EB", bg: "#EFF6FF" },
  recebida: { label: "Recebida", color: "#2563EB", bg: "#EFF6FF" },
  contato_pendente: { label: "1º contato pendente", color: "#D97706", bg: "#FFFBEB" },
  contato_realizado: { label: "Contato realizado", color: "#0EA5E9", bg: "#F0F9FF" },
  reuniao_marcada: { label: "Reunião marcada", color: "#8B5CF6", bg: "#F5F3FF" },
  diagnostico: { label: "Diagnóstico", color: "#8B5CF6", bg: "#F5F3FF" },
  proposta_enviada: { label: "Proposta enviada", color: "#D97706", bg: "#FFFBEB" },
  negociacao: { label: "Negociação", color: "#D97706", bg: "#FFFBEB" },
  fechada: { label: "Fechada", color: "#16A34A", bg: "#F0FDF4" },
  perdida: { label: "Perdida", color: "#CC0000", bg: "#FFF1F1" },
  parceria: { label: "Parceria", color: "#0EA5E9", bg: "#F0F9FF" },
  sem_perfil: { label: "Sem perfil", color: "#6B7280", bg: "#F5F5F7" },
  duplicada: { label: "Duplicada", color: "#6B7280", bg: "#F5F5F7" },
};

export const CONF_LABEL: Record<string, { label: string; color: string; bg: string } | null> = {
  nao_aplicavel: null,
  aguardando_declaracao: { label: "Declarar valor", color: "#D97706", bg: "#FFFBEB" },
  valor_declarado: { label: "Aguardando confirmação", color: "#2563EB", bg: "#EFF6FF" },
  confirmada: { label: "Valor confirmado ✓", color: "#16A34A", bg: "#F0FDF4" },
  contestada: { label: "Valor contestado", color: "#CC0000", bg: "#FFF1F1" },
  corrigida: { label: "Corrigida", color: "#2563EB", bg: "#EFF6FF" },
};

type Ref = {
  id: string;
  direcao: "dada" | "recebida";
  contactName: string;
  company: string | null;
  otherName: string;
  dataISO: string;
  estimatedValue: number;
  declaredValue: number | null;
  confirmedValue: number | null;
  status: string;
  confirmationStatus: string;
  origem: string;
};

type Props = {
  recebidas: Ref[];
  dadas: Ref[];
  members: { id: string; name: string }[];
  pendencias: { declarar: number; confirmar: number; semRetorno: number; paradas: number };
};

export default function ReferenciasClient(p: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [aba, setAba] = useState<"recebidas" | "dadas">(
    params.get("aba") === "dadas" ? "dadas" : "recebidas"
  );
  const [showNew, setShowNew] = useState(false);

  const list = aba === "recebidas" ? p.recebidas : p.dadas;

  const resumo = useMemo(() => {
    const arr = aba === "recebidas" ? p.recebidas : p.dadas;
    const fechadas = arr.filter((r) => r.status === "fechada");
    const valor = fechadas.reduce((s, r) => s + (r.confirmedValue ?? r.declaredValue ?? 0), 0);
    const emAndamento = arr.filter((r) => !["fechada", "perdida", "sem_perfil", "duplicada"].includes(r.status));
    return { total: arr.length, fechadas: fechadas.length, valor, emAndamento: emAndamento.length };
  }, [aba, p.recebidas, p.dadas]);

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Referências"
        subtitle="CRM e gestão de valor"
        right={
          <div className="flex items-center gap-2">
            <Link href="/convidados">
              <motion.div whileTap={{ scale: 0.9 }} className="w-9 h-9 rounded-full bg-background flex items-center justify-center touch-manipulation">
                <UserPlus size={16} className="text-text-main" strokeWidth={2} />
              </motion.div>
            </Link>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowNew(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full touch-manipulation"
              style={{ backgroundColor: "#FFF1F1" }}
            >
              <Plus size={14} color="#CC0000" strokeWidth={2.5} />
              <span className="text-[11px] font-bold text-primary">Nova</span>
            </motion.button>
          </div>
        }
      />

      <div className="px-4 py-4 space-y-4">
        {/* Abas */}
        <div className="bg-surface rounded-2xl p-1 flex border border-gray-100">
          {(["recebidas", "dadas"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setAba(t)}
              className="flex-1 h-10 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 touch-manipulation transition-colors"
              style={{
                backgroundColor: aba === t ? "#CC0000" : "transparent",
                color: aba === t ? "#FFFFFF" : "#8A8A8E",
              }}
            >
              {t === "recebidas" ? <Inbox size={14} /> : <Send size={14} />}
              {t === "recebidas" ? "Recebidas" : "Dadas"}
              {t === "recebidas" && p.pendencias.declarar > 0 && (
                <span className="min-w-[16px] h-4 px-1 rounded-full bg-white text-primary text-[9px] font-extrabold flex items-center justify-center">
                  {p.pendencias.declarar}
                </span>
              )}
              {t === "dadas" && p.pendencias.confirmar > 0 && (
                <span className="min-w-[16px] h-4 px-1 rounded-full bg-white text-primary text-[9px] font-extrabold flex items-center justify-center">
                  {p.pendencias.confirmar}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Resumo */}
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          <motion.div variants={fadeUp} className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-4 grid grid-cols-4 gap-2">
            {[
              { label: "Total", value: `${resumo.total}`, color: "#1A1A1A" },
              { label: "Em andamento", value: `${resumo.emAndamento}`, color: "#D97706" },
              { label: "Fechadas", value: `${resumo.fechadas}`, color: "#16A34A" },
              { label: aba === "recebidas" ? "Recebido" : "Gerado", value: fmtMoney(resumo.valor, true), color: "#16A34A" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center">
                <span className="text-[16px] font-extrabold font-display" style={{ color: s.color }}>
                  {s.value}
                </span>
                <span className="text-[9px] text-text-muted font-semibold text-center leading-tight">{s.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Lista */}
        <div className="space-y-2.5">
          {list.length === 0 && (
            <div className="bg-surface rounded-2xl border border-gray-100 p-8 flex flex-col items-center text-center">
              <Send size={32} className="text-gray-300 mb-2" />
              <p className="text-[14px] font-bold text-text-main font-display">Nenhuma referência</p>
              <p className="text-[11px] text-text-muted mt-1">Toque em Nova para registrar.</p>
            </div>
          )}
          {list.map((r) => {
            const st = STATUS_LABEL[r.status] ?? STATUS_LABEL.recebida;
            const conf = CONF_LABEL[r.confirmationStatus];
            const valor = r.confirmedValue ?? r.declaredValue ?? r.estimatedValue;
            return (
              <Link key={r.id} href={`/referencias/${r.id}`}>
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-4 mb-2.5 touch-manipulation"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-extrabold text-text-main font-display truncate">
                        {r.contactName}
                      </p>
                      <p className="text-[11px] text-text-muted truncate">
                        {r.direcao === "recebida" ? "De" : "Para"}: {r.otherName}
                        {r.company ? ` · ${r.company}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {valor > 0 && (
                        <span className="text-[13px] font-extrabold font-display text-text-main">
                          {fmtMoney(valor, true)}
                        </span>
                      )}
                      <span className="text-[9px] text-text-muted">
                        {new Date(r.dataISO + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </span>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ color: st.color, backgroundColor: st.bg }}>
                      {st.label}
                    </span>
                    {conf && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ color: conf.color, backgroundColor: conf.bg }}>
                        {conf.label}
                      </span>
                    )}
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Sheet: nova referência */}
      <AnimatePresence>
        {showNew && (
          <NewReferralSheet
            members={p.members}
            defaultDirecao={aba === "dadas" ? "dada" : "recebida"}
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

function NewReferralSheet({
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
                  backgroundColor: direcao === d ? "#FFF1F1" : "#F5F5F7",
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
              <option value="">— Fora do capítulo —</option>
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
