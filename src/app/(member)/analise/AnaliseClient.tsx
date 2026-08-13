"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Filter, Sparkles, TrendingUp, Users2, Handshake, Calculator } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import { PageHeader, ProgressBar, fmtMoney, fadeUp, stagger } from "@/components/ui";

type Props = {
  windowLabel: string;
  funil: {
    recebidas: number;
    contatadas: number;
    reunioes: number;
    propostas: number;
    fechadas: number;
    perdidas: number;
    taxaContato: number;
    taxaConversao: number;
    valorFechado: number;
    ticketMedio: number;
    tempoMedioContato: number | null;
  };
  relacionamentos: {
    id: string;
    name: string;
    recebidasDele: number;
    dadasParaEle: number;
    valorRecebido: number;
    valorGerado: number;
    oneToOnes: number;
    reciprocidade: number | null;
    diasSemInteracao: number | null;
  }[];
  evolucao: { label: string; pontos: number }[];
  insights: string[];
  targetScore: number;
};

export default function AnaliseClient(p: Props) {
  const f = p.funil;
  const funnelSteps = [
    { label: "Recebidas", value: f.recebidas, color: "#2563EB" },
    { label: "Contatadas", value: f.contatadas, color: "#0EA5E9" },
    { label: "Reuniões", value: f.reunioes, color: "#8B5CF6" },
    { label: "Propostas", value: f.propostas, color: "#D97706" },
    { label: "Fechadas", value: f.fechadas, color: "#16A34A" },
  ];
  const maxFunnel = Math.max(f.recebidas, 1);

  return (
    <div className="flex flex-col">
      <PageHeader title="Análise" subtitle={`Análise semestral · ${p.windowLabel}`} />

      <motion.div initial="hidden" animate="visible" variants={stagger} className="px-4 py-4 space-y-4">
        {/* Insights */}
        <motion.div variants={fadeUp} className="bg-surface rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-red-500 via-amber-400 to-green-500" />
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-[var(--tint-red-bg)] flex items-center justify-center">
                <Sparkles size={16} color="#CC0000" />
              </div>
              <div>
                <p className="text-[13px] font-extrabold text-text-main font-display">Diagnóstico Geral</p>
                <p className="text-[10px] text-text-muted">Insights automáticos do seu desempenho</p>
              </div>
            </div>
            <ul className="space-y-2">
              {p.insights.length === 0 && (
                <li className="text-[12px] text-text-muted">Registre mais dados para gerar insights.</li>
              )}
              {p.insights.map((i, idx) => (
                <li key={idx} className="flex gap-2 text-[12px] font-semibold text-text-main leading-relaxed">
                  <span className="text-primary flex-shrink-0">•</span>
                  {i}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Funil de conversão */}
        <motion.div variants={fadeUp} className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-[var(--tint-blue-bg)] flex items-center justify-center">
              <Filter size={16} color="#2563EB" />
            </div>
            <div>
              <p className="text-[13px] font-extrabold text-text-main font-display">Funil de Conversão</p>
              <p className="text-[10px] text-text-muted">Referências recebidas no semestre</p>
            </div>
          </div>
          <div className="space-y-2">
            {funnelSteps.map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-text-muted w-20 flex-shrink-0">{s.label}</span>
                <div className="flex-1">
                  <ProgressBar pct={(s.value / maxFunnel) * 100} color={s.color} h="h-4" />
                </div>
                <span className="text-[12px] font-extrabold font-display w-6 text-right" style={{ color: s.color }}>
                  {s.value}
                </span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-gray-100">
            {[
              { label: "Taxa contato", value: `${f.taxaContato}%` },
              { label: "Conversão", value: `${f.taxaConversao}%`, color: f.taxaConversao >= 40 ? "#16A34A" : "#D97706" },
              { label: "Ticket médio", value: fmtMoney(f.ticketMedio, true) },
              { label: "Recebido", value: fmtMoney(f.valorFechado, true), color: "#16A34A" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center">
                <span className="text-[14px] font-extrabold font-display" style={{ color: s.color ?? "var(--color-text-main)" }}>
                  {s.value}
                </span>
                <span className="text-[8.5px] text-text-muted font-semibold text-center leading-tight">{s.label}</span>
              </div>
            ))}
          </div>
          {f.tempoMedioContato !== null && (
            <p className="text-[10px] text-text-muted mt-2">
              Tempo médio até o primeiro contato: <strong>{f.tempoMedioContato} dia(s)</strong>
            </p>
          )}
        </motion.div>

        {/* Calculadora de ROI */}
        <RoiCalculator valorRecebido={f.valorFechado} windowLabel={p.windowLabel} />

        {/* Evolução da pontuação oficial */}
        {p.evolucao.length > 0 && (
          <motion.div variants={fadeUp} className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center">
                <TrendingUp size={16} color="#16A34A" />
              </div>
              <div>
                <p className="text-[13px] font-extrabold text-text-main font-display">Evolução da Pontuação</p>
                <p className="text-[10px] text-text-muted">Relatórios oficiais importados</p>
              </div>
            </div>
            <div className="h-40 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={p.evolucao} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 9, fill: "var(--color-text-muted)" }}
                    axisLine={{ stroke: "var(--color-border)" }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, (max: number) => Math.max(max, p.targetScore) + 10]}
                    tick={{ fontSize: 9, fill: "var(--color-text-muted)" }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <ReferenceLine y={p.targetScore} stroke="#F59E0B" strokeDasharray="4 4" strokeWidth={1.5} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 10,
                      fontSize: 11,
                    }}
                    labelStyle={{ color: "var(--color-text-main)", fontWeight: 700 }}
                    formatter={(value) => [`${value} pts`, "Pontuação"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="pontos"
                    stroke="#16A34A"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: "#16A34A", strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[9px] text-text-muted mt-1 flex items-center gap-1">
              <span className="inline-block w-3 border-t-2 border-dashed" style={{ borderColor: "#F59E0B" }} /> meta ({p.targetScore} pts)
            </p>
          </motion.div>
        )}

        {/* Relacionamentos */}
        <motion.div variants={fadeUp} className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-[var(--tint-purple-bg)] flex items-center justify-center">
              <Users2 size={16} color="#8B5CF6" />
            </div>
            <div>
              <p className="text-[13px] font-extrabold text-text-main font-display">Relacionamentos</p>
              <p className="text-[10px] text-text-muted">Reciprocidade e valor por membro</p>
            </div>
          </div>
          {p.relacionamentos.length === 0 && (
            <p className="text-[12px] text-text-muted">
              Registre referências vinculadas a membros para ver a análise de reciprocidade.
            </p>
          )}
          <div className="space-y-3">
            {p.relacionamentos.map((r) => (
              <div key={r.id} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[13px] font-extrabold text-text-main font-display">{r.name}</p>
                  {r.diasSemInteracao !== null && r.diasSemInteracao > 60 && (
                    <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      {r.diasSemInteracao}d sem interação
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                  <span className="text-text-muted">
                    Você → ele: <strong className="text-text-main">{r.dadasParaEle} refs</strong>
                    {r.valorGerado > 0 && <strong className="text-green-600"> · {fmtMoney(r.valorGerado, true)}</strong>}
                  </span>
                  <span className="text-text-muted">
                    Ele → você: <strong className="text-text-main">{r.recebidasDele} refs</strong>
                    {r.valorRecebido > 0 && <strong className="text-green-600"> · {fmtMoney(r.valorRecebido, true)}</strong>}
                  </span>
                  <span className="text-text-muted">
                    1-a-1: <strong className="text-text-main">{r.oneToOnes}</strong>
                  </span>
                  {r.reciprocidade !== null && (
                    <span className="text-text-muted">
                      Reciprocidade: <strong className="text-text-main">{r.reciprocidade}</strong>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="rounded-2xl bg-[var(--tint-purple-bg)] border border-purple-100 p-4 flex gap-3">
          <Handshake size={18} color="#8B5CF6" className="flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-purple-900 leading-relaxed">
            A análise de reciprocidade é um apoio para desenvolver relacionamentos — não uma obrigação.
            Use-a para identificar oportunidades de 1-a-1 e parcerias estratégicas.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

function RoiCalculator({ valorRecebido, windowLabel }: { valorRecebido: number; windowLabel: string }) {
  const STORAGE_KEY = "bni-roi-investimento";
  const [investimento, setInvestimento] = useState<string>("");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setInvestimento(saved);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, investimento);
  }, [investimento]);

  const investimentoNum = parseFloat(investimento.replace(",", "."));
  const temInvestimento = !isNaN(investimentoNum) && investimentoNum > 0;
  const roi = temInvestimento ? valorRecebido / investimentoNum : null;

  return (
    <motion.div variants={fadeUp} className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-[var(--tint-blue-bg)] flex items-center justify-center">
          <Calculator size={16} color="#2563EB" />
        </div>
        <div>
          <p className="text-[13px] font-extrabold text-text-main font-display">Calculadora de ROI</p>
          <p className="text-[10px] text-text-muted">Quanto você recebeu para cada real investido na BNI</p>
        </div>
      </div>
      <label className="block text-[11px] font-semibold text-text-muted mb-1">
        Quanto você investiu na BNI no período ({windowLabel})?
      </label>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[13px] font-bold text-text-muted">R$</span>
        <input
          type="text"
          inputMode="decimal"
          value={investimento}
          onChange={(e) => setInvestimento(e.target.value)}
          placeholder="Ex: 3500"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-[13px] font-semibold text-text-main bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      {temInvestimento ? (
        <div className="rounded-xl bg-green-50 border border-green-100 p-3 text-center">
          <p className="text-[20px] font-extrabold font-display text-green-700">{roi!.toFixed(1)}x</p>
          <p className="text-[11px] text-green-800 font-semibold mt-0.5">
            Você recebeu {fmtMoney(valorRecebido, true)} — {roi!.toFixed(1)}x o que investiu
          </p>
        </div>
      ) : (
        <p className="text-[11px] text-text-muted">
          Informe o valor investido para calcular seu retorno sobre as referências fechadas neste período.
        </p>
      )}
    </motion.div>
  );
}
