"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, X, Minus, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui";

function Counter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <span className="text-[13px] font-semibold text-text-main">{label}</span>
      <div className="flex items-center gap-3">
        <motion.button
          type="button"
          whileTap={{ scale: 0.85 }}
          onClick={() => onChange(Math.max(value - 1, 0))}
          className="w-8 h-8 rounded-full bg-background flex items-center justify-center touch-manipulation"
        >
          <Minus size={14} className="text-text-muted" strokeWidth={2.5} />
        </motion.button>
        <span className="text-[16px] font-extrabold font-display w-6 text-center">{value}</span>
        <motion.button
          type="button"
          whileTap={{ scale: 0.85 }}
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-full bg-[#FFF1F1] flex items-center justify-center touch-manipulation"
        >
          <Plus size={14} color="#CC0000" strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 w-full touch-manipulation"
    >
      <span className="text-[13px] font-semibold text-text-main">{label}</span>
      <div
        className="w-11 h-6 rounded-full transition-colors relative"
        style={{ backgroundColor: value ? "#22C55E" : "#E5E7EB" }}
      >
        <motion.div
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
          animate={{ left: value ? 22 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      </div>
    </button>
  );
}

export default function RegistroSemanaPage() {
  const router = useRouter();
  const [dateISO, setDateISO] = useState(new Date().toISOString().slice(0, 10));
  const [presenca, setPresenca] = useState<"P" | "Aus" | "Subs">("P");
  const [atrasado, setAtrasado] = useState(false);
  const [ueg, setUeg] = useState(false);
  const [testemunho, setTestemunho] = useState(false);
  const [rdi, setRdi] = useState(0);
  const [rde, setRde] = useState(0);
  const [rri, setRri] = useState(0);
  const [rre, setRre] = useState(0);
  const [convidados, setConvidados] = useState(0);
  const [reunioes1a1, setReunioes1a1] = useState(0);
  const [onf, setOnf] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const weekNum = getWeekNumber(new Date(dateISO + "T00:00:00"));

  async function submit() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateISO, presenca, atrasado, ueg, testemunho,
          rdi, rde, rri, rre, convidados, reunioes1a1,
          onf: parseFloat(onf.replace(",", ".")) || 0,
          observacoes,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Erro ao salvar.");
        return;
      }
      router.push("/semanas");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title={`Semana ${weekNum}`}
        subtitle="Registro da reunião semanal"
        right={
          <button onClick={() => router.back()} className="w-8 h-8 rounded-full bg-background flex items-center justify-center touch-manipulation">
            <X size={16} className="text-text-muted" strokeWidth={2.5} />
          </button>
        }
      />

      <div className="px-4 py-4 space-y-4">
        {/* Data */}
        <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-4">
          <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2 block">
            Data da reunião
          </label>
          <input
            type="date"
            value={dateISO}
            onChange={(e) => setDateISO(e.target.value)}
            className="w-full bg-background rounded-xl px-4 py-3 text-[14px] font-semibold outline-none border-2 border-transparent focus:border-primary transition-colors"
          />
        </div>

        {/* Presença e comportamento */}
        <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-3">
            Presença e Comportamento
          </p>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {([
              { v: "P", label: "Presente" },
              { v: "Subs", label: "Substituto" },
              { v: "Aus", label: "Ausência" },
            ] as const).map((o) => (
              <motion.button
                key={o.v}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => setPresenca(o.v)}
                className="h-11 rounded-xl text-[12px] font-bold touch-manipulation border-2 transition-colors"
                style={{
                  backgroundColor: presenca === o.v ? (o.v === "Aus" ? "#FFF1F1" : o.v === "Subs" ? "#FFFBEB" : "#F0FDF4") : "#F5F5F7",
                  borderColor: presenca === o.v ? (o.v === "Aus" ? "#CC0000" : o.v === "Subs" ? "#F59E0B" : "#22C55E") : "transparent",
                  color: presenca === o.v ? (o.v === "Aus" ? "#CC0000" : o.v === "Subs" ? "#D97706" : "#16A34A") : "#8A8A8E",
                }}
              >
                {o.label}
              </motion.button>
            ))}
          </div>
          <Toggle label="Chegou atrasado" value={atrasado} onChange={setAtrasado} />
          <Toggle label="Participou do UEG" value={ueg} onChange={setUeg} />
          <Toggle label="Deu testemunho" value={testemunho} onChange={setTestemunho} />
        </div>

        {/* Métricas */}
        <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
            Métricas da Semana
          </p>
          <Counter label="Referências dadas (internas)" value={rdi} onChange={setRdi} />
          <Counter label="Referências dadas (externas)" value={rde} onChange={setRde} />
          <Counter label="Referências recebidas (internas)" value={rri} onChange={setRri} />
          <Counter label="Referências recebidas (externas)" value={rre} onChange={setRre} />
          <Counter label="Convidados trazidos" value={convidados} onChange={setConvidados} />
          <Counter label="Reuniões 1-a-1" value={reunioes1a1} onChange={setReunioes1a1} />
          <div className="pt-3">
            <label className="text-[13px] font-semibold text-text-main mb-2 block">ONF declarado (R$)</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={onf}
              onChange={(e) => setOnf(e.target.value)}
              className="w-full bg-background rounded-xl px-4 py-3 text-[16px] font-extrabold font-display outline-none border-2 border-transparent focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Observações */}
        <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">
            Observações <span className="normal-case font-medium">(opcional)</span>
          </p>
          <textarea
            rows={3}
            placeholder="Anotações sobre a semana, contatos feitos, oportunidades..."
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            className="w-full bg-background rounded-xl px-4 py-3 text-[13px] font-medium outline-none border-2 border-transparent focus:border-primary transition-colors resize-none"
          />
        </div>

        {error && (
          <p className="text-[12px] font-semibold text-primary bg-[#FFF1F1] rounded-xl px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => router.back()}
            className="flex-1 h-12 rounded-2xl bg-surface border border-gray-200 flex items-center justify-center touch-manipulation"
          >
            <span className="text-text-muted font-semibold text-[14px]">Cancelar</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={submit}
            disabled={saving}
            className="flex-1 h-12 rounded-2xl bg-primary flex items-center justify-center gap-2 touch-manipulation disabled:opacity-60"
          >
            <Check size={16} color="white" strokeWidth={2.5} />
            <span className="text-white font-bold text-[14px]">{saving ? "Salvando..." : "Salvar Semana"}</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function getWeekNumber(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
}
