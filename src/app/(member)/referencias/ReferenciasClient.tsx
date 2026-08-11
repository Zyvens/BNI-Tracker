"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  Send,
  Inbox,
  ChevronRight,
  PieChart as PieChartIcon,
  ArrowLeft,
  Scale,
  Handshake,
  Trash2,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { PageHeader, fmtMoney, fadeUp, stagger } from "@/components/ui";

// Categoria do negócio fechado — declarada pelo beneficiado ao confirmar o valor recebido.
export const DEAL_CATEGORY_LABEL: Record<string, { label: string; color: string }> = {
  real: { label: "Negócio real", color: "#16A34A" },
  parceria: { label: "Parceria", color: "#2563EB" },
  permuta: { label: "Clube de permuta", color: "#D97706" },
};
const DEAL_CATEGORY_UNSET = { label: "Não categorizado", color: "#9CA3AF" };

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
  otherId: string | null;
  dataISO: string;
  estimatedValue: number;
  declaredValue: number | null;
  confirmedValue: number | null;
  status: string;
  confirmationStatus: string;
  origem: string;
  dealType: string | null;
};

type ReciprocityRow = {
  memberId: string;
  name: string;
  givenCount: number;
  givenClosed: number;
  receivedCount: number;
  receivedClosed: number;
  valueGenerated: number;
  valueGiven: number;
};

type ThankYouDebtRow = { id: string; name: string; monthlyValue: number; thanked: boolean };

type Props = {
  recebidas: Ref[];
  dadas: Ref[];
  members: { id: string; name: string }[];
  pendencias: { declarar: number; confirmar: number; semRetorno: number; paradas: number };
  reciprocidade: ReciprocityRow[];
  thankYouMonth: string;
  thankYouDebts: ThankYouDebtRow[];
};

export default function ReferenciasClient(p: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [aba, setAba] = useState<"recebidas" | "dadas" | "comparativo">(
    params.get("aba") === "dadas" ? "dadas" : params.get("aba") === "comparativo" ? "comparativo" : "recebidas"
  );
  const [showNew, setShowNew] = useState(false);

  const list = aba === "dadas" ? p.dadas : aba === "recebidas" ? p.recebidas : [];

  const resumo = useMemo(() => {
    const arr = aba === "dadas" ? p.dadas : p.recebidas;
    const fechadas = arr.filter((r) => r.status === "fechada");
    const valor = fechadas.reduce((s, r) => s + (r.confirmedValue ?? r.declaredValue ?? 0), 0);
    const emAndamento = arr.filter((r) => !["fechada", "perdida", "sem_perfil", "duplicada"].includes(r.status));
    return { total: arr.length, fechadas: fechadas.length, valor, emAndamento: emAndamento.length };
  }, [aba, p.recebidas, p.dadas]);

  // Quanto do resultado fechado é orgânico (real) vs. combinado (parceria/permuta) —
  // só faz sentido no recorte "recebidas": é o próprio membro fechando negócio.
  const categorias = useMemo(() => {
    const fechadas = p.recebidas.filter((r) => r.status === "fechada");
    const counts: Record<string, number> = { real: 0, parceria: 0, permuta: 0, indefinido: 0 };
    for (const r of fechadas) {
      counts[r.dealType && counts[r.dealType] !== undefined ? r.dealType : "indefinido"]++;
    }
    const total = fechadas.length;
    const data = (["real", "parceria", "permuta", "indefinido"] as const)
      .filter((k) => counts[k] > 0)
      .map((k) => ({
        key: k,
        label: k === "indefinido" ? DEAL_CATEGORY_UNSET.label : DEAL_CATEGORY_LABEL[k].label,
        color: k === "indefinido" ? DEAL_CATEGORY_UNSET.color : DEAL_CATEGORY_LABEL[k].color,
        value: counts[k],
        pct: total > 0 ? Math.round((counts[k] / total) * 100) : 0,
      }));
    return { total, data };
  }, [p.recebidas]);

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Referências"
        subtitle="CRM e gestão de valor"
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
              <span className="text-[11px] font-bold text-primary">Nova</span>
            </motion.button>
          </div>
        }
      />

      <div className="px-4 py-4 space-y-4">
        {/* Abas */}
        <div className="bg-surface rounded-2xl p-1 flex border border-gray-100">
          {(["recebidas", "dadas", "comparativo"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setAba(t)}
              className="flex-1 h-10 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 touch-manipulation transition-colors px-1"
              style={{
                backgroundColor: aba === t ? "#CC0000" : "transparent",
                color: aba === t ? "#FFFFFF" : "#8A8A8E",
              }}
            >
              {t === "recebidas" ? <Inbox size={14} /> : t === "dadas" ? <Send size={14} /> : <Scale size={14} />}
              {t === "recebidas" ? "Recebidas" : t === "dadas" ? "Dadas" : "Comparativo"}
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

        {aba === "comparativo" ? (
          <ComparativoSection
            rows={p.reciprocidade}
            thankYouMonth={p.thankYouMonth}
            thankYouDebts={p.thankYouDebts}
          />
        ) : (
          <>
        {/* Resumo */}
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          <motion.div variants={fadeUp} className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-4 grid grid-cols-4 gap-2">
            {[
              { label: "Total", value: `${resumo.total}`, color: "var(--color-text-main)" },
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

        {/* Categorização dos negócios fechados: real vs. combinado */}
        {aba === "recebidas" && categorias.total > 0 && (
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-background flex items-center justify-center">
                  <PieChartIcon size={15} className="text-text-main" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[13px] font-extrabold text-text-main font-display">Origem do resultado fechado</p>
                  <p className="text-[10px] text-text-muted">Quanto é orgânico vs. combinado (parceria/permuta)</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-[104px] h-[104px] flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categorias.data}
                        dataKey="value"
                        nameKey="label"
                        innerRadius={32}
                        outerRadius={50}
                        paddingAngle={categorias.data.length > 1 ? 3 : 0}
                        stroke="none"
                      >
                        {categorias.data.map((d) => (
                          <Cell key={d.key} fill={d.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-1.5">
                  {categorias.data.map((d) => (
                    <div key={d.key} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-[11px] font-semibold text-text-main truncate">{d.label}</span>
                      </div>
                      <span className="text-[11px] font-extrabold font-display flex-shrink-0" style={{ color: d.color }}>
                        {d.pct}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

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
              <motion.div
                key={r.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(`/referencias/${r.id}`)}
                className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-4 mb-2.5 touch-manipulation cursor-pointer"
              >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-extrabold text-text-main font-display truncate">
                        {r.contactName}
                      </p>
                      <p className="text-[11px] text-text-muted truncate">
                        {r.direcao === "recebida" ? "De" : "Para"}:{" "}
                        {r.otherId ? (
                          <Link
                            href={`/referencias/contato/${r.otherId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="underline underline-offset-2 decoration-gray-300"
                          >
                            {r.otherName}
                          </Link>
                        ) : (
                          r.otherName
                        )}
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
                    {r.dealType && DEAL_CATEGORY_LABEL[r.dealType] && (
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ color: DEAL_CATEGORY_LABEL[r.dealType].color, backgroundColor: DEAL_CATEGORY_LABEL[r.dealType].color + "1A" }}
                      >
                        {DEAL_CATEGORY_LABEL[r.dealType].label}
                      </span>
                    )}
                  </div>
              </motion.div>
            );
          })}
        </div>
        </>
        )}
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

// Seção "Comparativo": alterna entre o placar de reciprocidade por contato (Indicações)
// e o controle de agradecimento mensal fixo que te devem (A Receber).
function ComparativoSection({
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
            style={{ backgroundColor: view === v ? "#1A1A1A" : "transparent", color: view === v ? "#FFFFFF" : "#8A8A8E" }}
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
                  ? { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0", color: "#16A34A" }
                  : { backgroundColor: "#FFF1F1", borderColor: "#FECACA", color: "#CC0000" }
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
          {error && <p className="text-[12px] font-semibold text-primary bg-[#FFF1F1] rounded-xl px-3 py-2">{error}</p>}
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
