"use client";

import { motion } from "framer-motion";
import { Filter, Sparkles, TrendingUp, Users2, Handshake } from "lucide-react";
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
  const maxPontos = Math.max(...p.evolucao.map((e) => e.pontos), 100);

  return (
    <div className="flex flex-col">
      <PageHeader title="Análise" subtitle={`Análise semestral · ${p.windowLabel}`} />

      <motion.div initial="hidden" animate="visible" variants={stagger} className="px-4 py-4 space-y-4">
        {/* Insights */}
        <motion.div variants={fadeUp} className="bg-surface rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-red-500 via-amber-400 to-green-500" />
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-[#FFF1F1] flex items-center justify-center">
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
            <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
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
                <span className="text-[14px] font-extrabold font-display" style={{ color: s.color ?? "#1A1A1A" }}>
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
            <div className="flex items-end gap-1.5 h-28">
              {p.evolucao.map((e) => {
                const pct = (e.pontos / maxPontos) * 100;
                const color = e.pontos >= 100 ? "#F59E0B" : e.pontos >= 70 ? "#22C55E" : e.pontos >= 40 ? "#F59E0B" : "#CC0000";
                return (
                  <div key={e.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <span className="text-[9px] font-extrabold font-display" style={{ color }}>
                      {e.pontos}
                    </span>
                    <motion.div
                      className="w-full rounded-t-lg"
                      style={{ backgroundColor: color }}
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(pct * 0.7, 4)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                    <span className="text-[8px] text-text-muted font-semibold">{e.label}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Relacionamentos */}
        <motion.div variants={fadeUp} className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-[#F5F3FF] flex items-center justify-center">
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

        <motion.div variants={fadeUp} className="rounded-2xl bg-[#F5F3FF] border border-purple-100 p-4 flex gap-3">
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
