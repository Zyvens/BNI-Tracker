"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Scale, Handshake, Trash2, X } from "lucide-react";
import { fmtMoney, fadeUp, stagger } from "@/components/ui";
import type { ReciprocityRow } from "@/lib/reciprocity";
import type { ThankYouDebtRow } from "@/lib/thankYouDebts";

// Seção "Comparativo": alterna entre o placar de reciprocidade por contato (Indicações)
// e o controle de agradecimento mensal fixo que te devem (A Receber).
export default function ComparativoSection({
  rows,
  thankYouMonth,
  thankYouDebts,
}: {
  rows: ReciprocityRow[];
  thankYouMonth: string;
  thankYouDebts: ThankYouDebtRow[];
}) {
  const [view, setView] = useState<"indicacoes" | "a-receber">("indicacoes");
  return (
    <div className="space-y-3">
      <div className="bg-background rounded-full p-1 flex">
        {(["indicacoes", "a-receber"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="flex-1 h-9 rounded-full text-[11px] font-bold touch-manipulation transition-colors"
            style={{ backgroundColor: view === v ? "#CC0000" : "transparent", color: view === v ? "#FFFFFF" : "#8A8A8E" }}
          >
            {v === "indicacoes" ? "Indicações" : "A Receber"}
          </button>
        ))}
      </div>
      {view === "indicacoes" ? (
        <IndicacoesView rows={rows} />
      ) : (
        <AReceberView initialMonth={thankYouMonth} initialDebts={thankYouDebts} />
      )}
    </div>
  );
}

// Comparativo de reciprocidade: por contato, quanto você deu vs. recebeu — quantidade e
// valor separados — pra ver quem indica muito com pouco valor e quem indica pouco mas grosso.
function IndicacoesView({ rows }: { rows: ReciprocityRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="bg-surface rounded-2xl border border-gray-100 p-8 flex flex-col items-center text-center">
        <Scale size={32} className="text-gray-300 mb-2" />
        <p className="text-[14px] font-bold text-text-main font-display">Sem trocas registradas ainda</p>
        <p className="text-[11px] text-text-muted mt-1">
          O comparativo aparece assim que houver referências dadas ou recebidas com membros da equipe.
        </p>
      </div>
    );
  }

  const maisGerouR$ = [...rows].filter((r) => r.valueGenerated > 0).sort((a, b) => b.valueGenerated - a.valueGenerated)[0];
  const maisIndicou = [...rows].filter((r) => r.receivedCount > 0).sort((a, b) => b.receivedCount - a.receivedCount)[0];
  const mereceAtencao = [...rows].sort((a, b) => (b.receivedCount - b.givenCount) - (a.receivedCount - a.givenCount))[0];
  const voceDaMais = [...rows].sort((a, b) => (b.givenCount - b.receivedCount) - (a.givenCount - a.receivedCount))[0];

  const summaryCards = [
    maisGerouR$ && { label: "Quem mais te gerou em R$", name: maisGerouR$.name, value: fmtMoney(maisGerouR$.valueGenerated, true), color: "#16A34A" },
    maisIndicou && { label: "Quem mais te indicou", name: maisIndicou.name, value: `${maisIndicou.receivedCount} indicações`, color: "#2563EB" },
    mereceAtencao && mereceAtencao.receivedCount - mereceAtencao.givenCount > 0 && {
      label: "Merece mais atenção sua",
      name: mereceAtencao.name,
      value: `recebeu ${mereceAtencao.receivedCount} · você deu ${mereceAtencao.givenCount}`,
      color: "#D97706",
    },
    voceDaMais && voceDaMais.givenCount - voceDaMais.receivedCount > 0 && {
      label: "Você dá mais do que recebe",
      name: voceDaMais.name,
      value: `você deu ${voceDaMais.givenCount} · recebeu ${voceDaMais.receivedCount}`,
      color: "#CC0000",
    },
  ].filter(Boolean) as { label: string; name: string; value: string; color: string }[];

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-2.5">
      {summaryCards.length > 0 && (
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-2.5">
          {summaryCards.map((c) => (
            <div key={c.label} className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-3">
              <p className="text-[9px] font-bold uppercase tracking-wide text-text-muted leading-tight mb-1.5">{c.label}</p>
              <p className="text-[13px] font-extrabold text-text-main font-display leading-tight truncate">{c.name}</p>
              <p className="text-[11px] font-bold mt-0.5" style={{ color: c.color }}>{c.value}</p>
            </div>
          ))}
        </motion.div>
      )}

      <motion.p variants={fadeUp} className="text-[10px] text-text-muted leading-relaxed px-1">
        Uma pessoa por card: quantidade x quantidade, valor x valor — pra ver quem indica muito com pouco valor, e quem indica pouco mas grosso.
      </motion.p>

      {rows.map((row) => {
        const totalQtd = row.givenCount + row.receivedCount;
        const receivedQtdPct = totalQtd > 0 ? (row.receivedCount / totalQtd) * 100 : 50;
        const totalValor = row.valueGiven + row.valueGenerated;
        const receivedValorPct = totalValor > 0 ? (row.valueGenerated / totalValor) * 100 : 50;
        const firstName = row.name.split(" ")[0];

        let insight: string;
        let insightColor: string;
        if (row.givenCount === 0) {
          insight = `${firstName} já te indicou, você ainda não retribuiu`;
          insightColor = "#2563EB";
        } else if (row.receivedCount === 0) {
          insight = `Você já indicou, ${firstName} ainda não retribuiu`;
          insightColor = "#CC0000";
        } else {
          const ratioQtd = row.receivedCount / row.givenCount;
          if (ratioQtd >= 1.4) insight = `${firstName} te indica bem mais do que você indica pra ${firstName === row.name ? "ela" : "ele(a)"}`;
          else if (ratioQtd <= 1 / 1.4) insight = `Você indica bem mais do que ${firstName} te indica`;
          else insight = "Quantidade de indicações equilibrada";
          insightColor = ratioQtd >= 1.4 ? "#2563EB" : ratioQtd <= 1 / 1.4 ? "#CC0000" : "#16A34A";
          if (row.valueGiven > 0 && row.valueGenerated > 0) {
            const valorMedioRecebido = row.valueGenerated / row.receivedClosed || 0;
            const valorMedioDado = row.valueGiven / row.givenClosed || 0;
            if (valorMedioRecebido > 0 && valorMedioDado > 0) {
              if (valorMedioDado >= valorMedioRecebido * 1.4) insight += " · suas indicações pra ela valem bem mais em média";
              else if (valorMedioRecebido >= valorMedioDado * 1.4) insight += " · as indicações dela pra você valem bem mais em média";
            }
          }
        }

        return (
          <motion.div key={row.memberId} variants={fadeUp}>
            <Link href={`/referencias/contato/${row.memberId}`}>
              <motion.div whileTap={{ scale: 0.98 }} className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-4 touch-manipulation">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <p className="text-[14px] font-extrabold text-text-main font-display truncate">{row.name}</p>
                  <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                </div>

                <p className="text-[9px] font-bold uppercase tracking-wide text-text-muted mb-1">Quantidade de indicações</p>
                <BarRow label="Recebido" value={`${row.receivedCount}`} pct={receivedQtdPct} color="#16A34A" />
                <BarRow label="Você deu" value={`${row.givenCount}`} pct={100 - receivedQtdPct} color="#D97706" />

                <p className="text-[9px] font-bold uppercase tracking-wide text-text-muted mb-1 mt-3">Valor gerado</p>
                <BarRow label="Recebido" value={fmtMoney(row.valueGenerated, true)} pct={receivedValorPct} color="#16A34A" />
                <BarRow label="Você deu" value={fmtMoney(row.valueGiven, true)} pct={100 - receivedValorPct} color="#D97706" />

                <p className="text-[11px] font-bold mt-3" style={{ color: insightColor }}>{insight}</p>
              </motion.div>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

function BarRow({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-[10px] font-semibold text-text-muted w-14 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.max(pct, pct > 0 ? 3 : 0)}%`, backgroundColor: color }} />
      </div>
      <span className="text-[10px] font-bold text-text-main w-16 flex-shrink-0 text-right">{value}</span>
    </div>
  );
}

const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
};
const shiftMonth = (key: string, delta: number) => {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

// "A Receber": pessoas que te devem um agradecimento mensal fixo (valor que você gera
// pra elas todo mês), com controle mês a mês de quem já agradeceu.
function AReceberView({ initialMonth, initialDebts }: { initialMonth: string; initialDebts: ThankYouDebtRow[] }) {
  const router = useRouter();
  const [month, setMonth] = useState(initialMonth);
  const [debts, setDebts] = useState(initialDebts);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  async function goToMonth(next: string) {
    setMonth(next);
    setLoading(true);
    try {
      const res = await fetch(`/api/thank-you-debts?month=${next}`);
      const data = await res.json();
      setDebts(data.debts);
    } finally {
      setLoading(false);
    }
  }

  async function toggle(id: string) {
    setBusy(id);
    try {
      await fetch(`/api/thank-you-debts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle-month", monthKey: month }),
      });
      await goToMonth(month);
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    setBusy(id);
    try {
      await fetch(`/api/thank-you-debts/${id}`, { method: "DELETE" });
      await goToMonth(month);
    } finally {
      setBusy(null);
    }
  }

  const total = debts.reduce((s, d) => s + d.monthlyValue, 0);
  const jaAgradeceu = debts.filter((d) => d.thanked).reduce((s, d) => s + d.monthlyValue, 0);
  const aindaFalta = total - jaAgradeceu;

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-3">
      <motion.p variants={fadeUp} className="text-[10px] text-text-muted leading-relaxed px-1">
        Os negócios que você gerou pra elas — pra conferir se o agradecimento delas apareceu esse mês.
      </motion.p>

      <motion.div variants={fadeUp} className="flex items-center justify-between px-1">
        <button onClick={() => goToMonth(shiftMonth(month, -1))} className="w-8 h-8 rounded-full bg-surface border border-gray-100 flex items-center justify-center touch-manipulation">
          <ChevronRight size={14} className="text-text-main rotate-180" />
        </button>
        <p className="text-[13px] font-extrabold text-text-main font-display capitalize">{monthLabel(month)}</p>
        <button onClick={() => goToMonth(shiftMonth(month, 1))} className="w-8 h-8 rounded-full bg-surface border border-gray-100 flex items-center justify-center touch-manipulation">
          <ChevronRight size={14} className="text-text-main" />
        </button>
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-2" style={{ opacity: loading ? 0.5 : 1 }}>
        <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-3 flex flex-col items-center text-center">
          <span className="text-[9px] font-bold uppercase tracking-wide text-text-muted">Total do mês</span>
          <span className="text-[15px] font-extrabold font-display text-text-main mt-0.5">{fmtMoney(total, true)}</span>
        </div>
        <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-3 flex flex-col items-center text-center">
          <span className="text-[9px] font-bold uppercase tracking-wide text-text-muted">Já me agradeceu</span>
          <span className="text-[15px] font-extrabold font-display mt-0.5" style={{ color: "#16A34A" }}>{fmtMoney(jaAgradeceu, true)}</span>
        </div>
        <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-3 flex flex-col items-center text-center">
          <span className="text-[9px] font-bold uppercase tracking-wide text-text-muted">Ainda falta</span>
          <span className="text-[15px] font-extrabold font-display mt-0.5" style={{ color: aindaFalta > 0 ? "#CC0000" : "#16A34A" }}>{fmtMoney(aindaFalta, true)}</span>
        </div>
      </motion.div>

      {debts.length === 0 && (
        <motion.div variants={fadeUp} className="bg-surface rounded-2xl border border-gray-100 p-6 flex flex-col items-center text-center">
          <Handshake size={28} className="text-gray-300 mb-2" />
          <p className="text-[12px] text-text-muted">Ninguém cadastrado ainda neste mês.</p>
        </motion.div>
      )}

      {debts.map((d) => (
        <motion.div key={d.id} variants={fadeUp} className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-3.5 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-[13px] font-extrabold text-text-main font-display truncate">{d.name}</p>
              <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-background text-text-muted uppercase">Mensal</span>
            </div>
            <p className="text-[11px] text-text-muted">{fmtMoney(d.monthlyValue, true)} / mês</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              disabled={busy === d.id}
              onClick={() => toggle(d.id)}
              className="px-2.5 py-1.5 rounded-full text-[10px] font-bold touch-manipulation border"
              style={
                d.thanked
                  ? { backgroundColor: "var(--tint-green-bg)", borderColor: "var(--tint-green-border)", color: "#16A34A" }
                  : { backgroundColor: "var(--tint-red-bg)", borderColor: "var(--tint-red-border)", color: "#CC0000" }
              }
            >
              {d.thanked ? "✓ Agradeceu" : "Ainda não"}
            </button>
            <button disabled={busy === d.id} onClick={() => remove(d.id)} className="text-text-muted touch-manipulation">
              <Trash2 size={14} />
            </button>
          </div>
        </motion.div>
      ))}

      <motion.button
        variants={fadeUp}
        onClick={() => setShowAdd(true)}
        className="w-full rounded-2xl border-2 border-dashed border-gray-200 py-3.5 text-[12px] font-bold text-text-muted touch-manipulation"
      >
        + adicionar pessoa que te deve agradecimento fixo
      </motion.button>

      <AnimatePresence>
        {showAdd && (
          <NewThankYouDebtSheet
            onClose={() => setShowAdd(false)}
            onSaved={() => {
              setShowAdd(false);
              goToMonth(month);
              router.refresh();
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function NewThankYouDebtSheet({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [monthlyValue, setMonthlyValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!name.trim()) return setError("Informe o nome da pessoa.");
    const value = parseFloat(monthlyValue.replace(/\./g, "").replace(",", "."));
    if (!value || value <= 0) return setError("Informe o valor mensal.");
    setSaving(true);
    try {
      const res = await fetch("/api/thank-you-debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, monthlyValue: value }),
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
        className="w-full bg-surface rounded-t-3xl overflow-hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="text-[16px] font-extrabold text-text-main font-display">Agradecimento fixo</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-background flex items-center justify-center touch-manipulation">
            <X size={16} className="text-text-muted" strokeWidth={2.5} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3.5">
          <input
            className="w-full bg-background rounded-xl px-3.5 py-3 text-[13px] font-semibold outline-none border-2 border-transparent focus:border-primary transition-colors"
            placeholder="Nome da pessoa"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] font-bold text-text-muted">R$</span>
            <input
              className="w-full bg-background rounded-xl pl-10 pr-4 py-3 text-[13px] font-semibold outline-none border-2 border-transparent focus:border-primary transition-colors"
              placeholder="Valor mensal"
              inputMode="decimal"
              value={monthlyValue}
              onChange={(e) => setMonthlyValue(e.target.value)}
            />
          </div>
          {error && <p className="text-[12px] font-semibold text-primary bg-[var(--tint-red-bg)] rounded-xl px-3 py-2">{error}</p>}
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
