"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  CheckCircle2,
  XCircle,
  BadgeDollarSign,
  PencilLine,
  Clock,
} from "lucide-react";
import { PageHeader, fmtMoney } from "@/components/ui";
import { STATUS_LABEL, CONF_LABEL } from "../ReferenciasClient";

const PIPELINE_STEPS = [
  "recebida",
  "contato_realizado",
  "reuniao_marcada",
  "proposta_enviada",
  "negociacao",
  "fechada",
];

type Props = {
  referral: {
    id: string;
    isGiver: boolean;
    contactName: string;
    company: string | null;
    phone: string | null;
    email: string | null;
    segment: string | null;
    origem: string;
    dataISO: string;
    estimatedValue: number;
    notes: string | null;
    status: string;
    nextAction: string | null;
    nextActionISO: string | null;
    lostReason: string | null;
    giverName: string | null;
    receiverName: string | null;
    declaredValue: number | null;
    declaredISO: string | null;
    confirmationStatus: string;
    confirmedValue: number | null;
    heardInMeeting: boolean;
    inOfficialSystem: boolean;
    logs: { id: string; dataISO: string; tipo: string; texto: string }[];
  };
};

const ORIGEM_LABEL: Record<string, string> = {
  referencia_direta: "Referência Direta",
  parceria_estrategica: "Parceria Estratégica",
  indicacao_recorrente: "Indicação Recorrente",
  negocio_compartilhado: "Negócio Compartilhado",
  clube_permuta: "Clube de Permuta",
  cliente_proprio: "Cliente Próprio",
};

export default function ReferralDetailClient({ referral: r }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [sheet, setSheet] = useState<null | "declarar" | "contestar" | "perdida" | "nota">(null);

  const st = STATUS_LABEL[r.status] ?? STATUS_LABEL.recebida;
  const conf = CONF_LABEL[r.confirmationStatus];

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/referrals/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setSheet(null);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  const stepIndex = PIPELINE_STEPS.indexOf(r.status);
  const nextStep =
    !r.isGiver && stepIndex >= 0 && stepIndex < PIPELINE_STEPS.length - 1
      ? PIPELINE_STEPS[stepIndex + 1]
      : null;

  return (
    <div className="flex flex-col">
      <PageHeader
        title={r.contactName}
        subtitle={r.company ?? ORIGEM_LABEL[r.origem]}
        right={
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-background flex items-center justify-center touch-manipulation">
            <ArrowLeft size={16} className="text-text-main" strokeWidth={2.5} />
          </button>
        }
      />

      <div className="px-4 py-4 space-y-4">
        {/* Status e valor */}
        <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ color: st.color, backgroundColor: st.bg }}>
              {st.label}
            </span>
            {conf && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ color: conf.color, backgroundColor: conf.bg }}>
                {conf.label}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Info label={r.isGiver ? "Beneficiado" : "Enviada por"} value={r.isGiver ? (r.receiverName ?? "—") : (r.giverName ?? "—")} />
            <Info label="Data" value={new Date(r.dataISO + "T00:00:00").toLocaleDateString("pt-BR")} />
            <Info label="Valor estimado" value={r.estimatedValue > 0 ? fmtMoney(r.estimatedValue) : "—"} />
            <Info
              label="Valor declarado"
              value={r.declaredValue != null ? fmtMoney(r.declaredValue) : "—"}
              highlight={r.confirmationStatus === "confirmada" ? "#16A34A" : undefined}
            />
            {r.segment && <Info label="Segmento" value={r.segment} />}
            <Info label="Origem" value={ORIGEM_LABEL[r.origem] ?? r.origem} />
          </div>
          {r.notes && <p className="text-[11.5px] text-text-muted mt-3 leading-relaxed">{r.notes}</p>}
          {r.lostReason && (
            <p className="text-[11.5px] font-semibold text-primary mt-3">Motivo da perda: {r.lostReason}</p>
          )}
        </div>

        {/* Ações rápidas de contato */}
        {r.phone && (
          <div className="grid grid-cols-2 gap-3">
            <a href={`tel:${r.phone}`}>
              <motion.div whileTap={{ scale: 0.96 }} className="h-12 rounded-2xl bg-surface border border-gray-200 flex items-center justify-center gap-2 touch-manipulation">
                <Phone size={15} className="text-text-main" />
                <span className="text-[13px] font-bold text-text-main">Ligar Agora</span>
              </motion.div>
            </a>
            <a href={`https://wa.me/55${r.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
              <motion.div whileTap={{ scale: 0.96 }} className="h-12 rounded-2xl bg-[#F0FDF4] border border-green-200 flex items-center justify-center gap-2 touch-manipulation">
                <MessageCircle size={15} color="#16A34A" />
                <span className="text-[13px] font-bold text-green-600">Enviar Mensagem</span>
              </motion.div>
            </a>
          </div>
        )}

        {/* Ciclo de valor (base compartilhada) */}
        {(r.status === "fechada" || r.confirmationStatus !== "nao_aplicavel") && (
          <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center">
                <BadgeDollarSign size={16} color="#16A34A" />
              </div>
              <p className="text-[13px] font-extrabold text-text-main font-display">Confirmação de Valor</p>
            </div>

            {/* Beneficiado: declarar/corrigir */}
            {!r.isGiver && ["aguardando_declaracao", "contestada"].includes(r.confirmationStatus) && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setSheet("declarar")}
                className="w-full h-12 rounded-2xl bg-primary flex items-center justify-center gap-2 touch-manipulation"
              >
                <BadgeDollarSign size={16} color="white" />
                <span className="text-white font-bold text-[14px]">
                  {r.confirmationStatus === "contestada" ? "Corrigir valor declarado" : "Declarar valor recebido"}
                </span>
              </motion.button>
            )}

            {/* Gerador: confirmar/contestar */}
            {r.isGiver && r.confirmationStatus === "valor_declarado" && (
              <div className="space-y-2.5">
                <p className="text-[12px] text-text-muted">
                  {r.receiverName ?? "O beneficiado"} declarou{" "}
                  <strong className="text-text-main">{fmtMoney(r.declaredValue ?? 0)}</strong> proveniente da sua
                  referência.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    disabled={busy}
                    onClick={() => patch({ action: "confirmar" })}
                    className="h-12 rounded-2xl bg-[#F0FDF4] border border-green-200 flex items-center justify-center gap-2 touch-manipulation"
                  >
                    <CheckCircle2 size={15} color="#16A34A" />
                    <span className="text-[13px] font-bold text-green-600">Confirmar</span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    disabled={busy}
                    onClick={() => setSheet("contestar")}
                    className="h-12 rounded-2xl bg-[#FFF1F1] border border-red-200 flex items-center justify-center gap-2 touch-manipulation"
                  >
                    <XCircle size={15} color="#CC0000" />
                    <span className="text-[13px] font-bold text-primary">Contestar</span>
                  </motion.button>
                </div>
              </div>
            )}

            {r.confirmationStatus === "confirmada" && (
              <p className="text-[12px] font-semibold text-green-600 bg-green-50 rounded-xl px-3 py-2.5">
                ✓ Valor de {fmtMoney(r.confirmedValue ?? 0)} confirmado pelo gerador.
              </p>
            )}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {r.heardInMeeting && <Tag label="Apresentado em reunião" />}
              {r.inOfficialSystem && <Tag label="Lançado no sistema oficial" />}
            </div>
          </div>
        )}

        {/* Pipeline (beneficiado gerencia a oportunidade) */}
        {!r.isGiver && !["perdida", "sem_perfil", "duplicada"].includes(r.status) && (
          <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-4 space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Avançar oportunidade</p>
            {nextStep && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                disabled={busy}
                onClick={() => patch({ action: "status", status: nextStep })}
                className="w-full h-12 rounded-2xl bg-primary flex items-center justify-center touch-manipulation"
              >
                <span className="text-white font-bold text-[14px]">
                  Marcar como “{STATUS_LABEL[nextStep].label}”
                </span>
              </motion.button>
            )}
            {r.status !== "fechada" && (
              <button
                disabled={busy}
                onClick={() => setSheet("perdida")}
                className="w-full h-10 rounded-2xl flex items-center justify-center touch-manipulation"
              >
                <span className="text-[12px] font-bold text-text-muted">Marcar como perdida</span>
              </button>
            )}
          </div>
        )}

        {/* Histórico */}
        <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-extrabold text-text-main font-display">Histórico</p>
            <button
              onClick={() => setSheet("nota")}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-background touch-manipulation"
            >
              <PencilLine size={12} className="text-text-muted" />
              <span className="text-[10px] font-bold text-text-muted">Adicionar nota</span>
            </button>
          </div>
          <div className="space-y-3">
            {r.logs.length === 0 && <p className="text-[11px] text-text-muted">Sem eventos registrados.</p>}
            {r.logs.map((l) => (
              <div key={l.id} className="flex gap-2.5">
                <div className="w-6 h-6 rounded-full bg-background flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock size={11} className="text-text-muted" />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-text-main leading-snug">{l.texto}</p>
                  <p className="text-[10px] text-text-muted">
                    {new Date(l.dataISO + "T00:00:00").toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sheets */}
      <AnimatePresence>
        {sheet === "declarar" && (
          <ValueSheet
            title="Declarar valor recebido"
            onClose={() => setSheet(null)}
            onSubmit={(valor, extras) =>
              patch({
                action: r.confirmationStatus === "contestada" ? "corrigir" : "declarar",
                valor,
                ...extras,
              })
            }
          />
        )}
        {sheet === "contestar" && (
          <TextSheet
            title="Contestar valor"
            placeholder="Motivo da contestação..."
            cta="Contestar"
            onClose={() => setSheet(null)}
            onSubmit={(motivo) => patch({ action: "contestar", motivo })}
          />
        )}
        {sheet === "perdida" && (
          <TextSheet
            title="Marcar como perdida"
            placeholder="Motivo da perda (sem retorno, preço, timing...)"
            cta="Confirmar perda"
            onClose={() => setSheet(null)}
            onSubmit={(motivo) => patch({ action: "status", status: "perdida", lostReason: motivo })}
          />
        )}
        {sheet === "nota" && (
          <TextSheet
            title="Adicionar nota"
            placeholder="Registro de contato, próxima ação..."
            cta="Salvar nota"
            onClose={() => setSheet(null)}
            onSubmit={(texto) => patch({ action: "log", texto })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Info({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{label}</p>
      <p className="text-[13px] font-bold" style={{ color: highlight ?? "#1A1A1A" }}>{value}</p>
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span className="px-2 py-0.5 rounded-full bg-background text-[10px] font-bold text-text-muted">{label}</span>
  );
}

function SheetShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
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
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-[16px] font-extrabold text-text-main font-display">{title}</h2>
        </div>
        <div className="px-5 py-4 space-y-4">{children}</div>
      </motion.div>
    </motion.div>
  );
}

function ValueSheet({
  title,
  onClose,
  onSubmit,
}: {
  title: string;
  onClose: () => void;
  onSubmit: (valor: number, extras: { heardInMeeting: boolean; inOfficialSystem: boolean; receivedISO: string }) => void;
}) {
  const [valor, setValor] = useState("");
  const [receivedISO, setReceivedISO] = useState(new Date().toISOString().slice(0, 10));
  const [heard, setHeard] = useState(false);
  const [official, setOfficial] = useState(false);

  return (
    <SheetShell title={title} onClose={onClose}>
      <div>
        <label className="text-[12px] font-bold uppercase tracking-wider text-text-muted mb-2 block">Valor (R$)</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-bold text-text-muted">R$</span>
          <input
            type="text"
            inputMode="decimal"
            autoFocus
            className="w-full bg-background rounded-2xl pl-11 pr-4 py-4 text-[22px] font-extrabold font-display outline-none border-2 border-transparent focus:border-primary transition-colors"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0,00"
          />
        </div>
      </div>
      <div>
        <label className="text-[12px] font-bold uppercase tracking-wider text-text-muted mb-2 block">Data do recebimento</label>
        <input type="date" className="w-full bg-background rounded-xl px-3.5 py-3 text-[13px] font-semibold outline-none" value={receivedISO} onChange={(e) => setReceivedISO(e.target.value)} />
      </div>
      <label className="flex items-center gap-2.5 text-[13px] font-semibold text-text-main">
        <input type="checkbox" checked={heard} onChange={(e) => setHeard(e.target.checked)} className="w-4 h-4 accent-[#CC0000]" />
        Vou apresentar/apresentei na reunião
      </label>
      <label className="flex items-center gap-2.5 text-[13px] font-semibold text-text-main">
        <input type="checkbox" checked={official} onChange={(e) => setOfficial(e.target.checked)} className="w-4 h-4 accent-[#CC0000]" />
        Lançado no sistema oficial (ONF)
      </label>
      <div className="flex gap-3 pb-3">
        <motion.button whileTap={{ scale: 0.96 }} onClick={onClose} className="flex-1 h-12 rounded-2xl bg-background flex items-center justify-center touch-manipulation">
          <span className="text-text-muted font-semibold text-[14px]">Cancelar</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => onSubmit(parseFloat(valor.replace(/\./g, "").replace(",", ".")) || 0, { heardInMeeting: heard, inOfficialSystem: official, receivedISO })}
          className="flex-1 h-12 rounded-2xl bg-primary flex items-center justify-center touch-manipulation"
        >
          <span className="text-white font-bold text-[14px]">Declarar</span>
        </motion.button>
      </div>
    </SheetShell>
  );
}

function TextSheet({
  title,
  placeholder,
  cta,
  onClose,
  onSubmit,
}: {
  title: string;
  placeholder: string;
  cta: string;
  onClose: () => void;
  onSubmit: (texto: string) => void;
}) {
  const [texto, setTexto] = useState("");
  return (
    <SheetShell title={title} onClose={onClose}>
      <textarea
        rows={3}
        autoFocus
        className="w-full bg-background rounded-xl px-3.5 py-3 text-[13px] font-medium outline-none border-2 border-transparent focus:border-primary transition-colors resize-none"
        placeholder={placeholder}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />
      <div className="flex gap-3 pb-3">
        <motion.button whileTap={{ scale: 0.96 }} onClick={onClose} className="flex-1 h-12 rounded-2xl bg-background flex items-center justify-center touch-manipulation">
          <span className="text-text-muted font-semibold text-[14px]">Cancelar</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => texto.trim() && onSubmit(texto.trim())}
          className="flex-1 h-12 rounded-2xl bg-primary flex items-center justify-center touch-manipulation"
        >
          <span className="text-white font-bold text-[14px]">{cta}</span>
        </motion.button>
      </div>
    </SheetShell>
  );
}
