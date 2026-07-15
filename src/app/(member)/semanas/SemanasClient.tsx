"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Check, UserCheck, X, CalendarDays } from "lucide-react";
import { fmtMoney } from "@/components/ui";

type Entry = {
  id: string;
  dateISO: string;
  dataLabel: string;
  presenca: string;
  atrasado: boolean;
  ueg: boolean;
  testemunho: boolean;
  refs: number;
  convidados: number;
  reunioes1a1: number;
  onf: number;
  observacoes: string | null;
};

type Props = {
  windowLabel: string;
  totals: {
    reunioes1a1: number;
    convidados: number;
    uegs: number;
    onf: number;
    presencas: number;
    ausencias: number;
    substituicoes: number;
    total: number;
  };
  entries: Entry[];
};

function presStyle(presenca: string) {
  if (presenca === "Aus") return { color: "#CC0000", bg: "#FFF1F1", label: "Ausência" };
  if (presenca === "Subs") return { color: "#F59E0B", bg: "#FFFBEB", label: "Substituto" };
  return { color: "#22C55E", bg: "#F0FDF4", label: "Presente" };
}

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };

export default function SemanasClient(p: Props) {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="bg-surface border-b border-gray-100 sticky top-0 z-30" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="px-4 h-14 flex items-center justify-between">
          <div>
            <h1 className="text-[17px] font-extrabold text-text-main font-display">Reuniões Semanais</h1>
            <p className="text-[11px] text-text-muted">
              {p.windowLabel} · {p.totals.total} reuniões
            </p>
          </div>
          <Link href="/registro-semana">
            <motion.div whileTap={{ scale: 0.9 }} className="w-9 h-9 rounded-full bg-primary flex items-center justify-center touch-manipulation">
              <Plus size={18} color="white" strokeWidth={2.5} />
            </motion.div>
          </Link>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="px-4 py-4 space-y-4"
      >
        {/* Presenças */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Total", value: p.totals.total, color: "#1A1A1A" },
            { label: "Presentes", value: p.totals.presencas, color: "#22C55E" },
            { label: "Substitutos", value: p.totals.substituicoes, color: "#F59E0B" },
            { label: "Ausências", value: p.totals.ausencias, color: "#CC0000" },
          ].map((s) => (
            <div key={s.label} className="bg-surface rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col items-center gap-1 text-center">
              <span className="text-[18px] font-extrabold leading-none font-display" style={{ color: s.color }}>
                {s.value}
              </span>
              <span className="text-[9px] text-text-muted font-semibold leading-tight">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Totais semestrais */}
        <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-3">
            Totais Semestrais ({p.windowLabel})
          </p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "1-a-1", value: `${p.totals.reunioes1a1}`, color: "#8B5CF6" },
              { label: "Convidados", value: `${p.totals.convidados}`, color: "#0EA5E9" },
              { label: "UEGs", value: `${p.totals.uegs}`, color: "#22C55E" },
              { label: "ONF", value: fmtMoney(p.totals.onf, true), color: "#F59E0B" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-0.5 text-center">
                <span className="text-[16px] font-extrabold font-display" style={{ color: s.color }}>
                  {s.value}
                </span>
                <span className="text-[9px] text-text-muted font-semibold leading-tight">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Histórico */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-3">
            Histórico de Reuniões
          </p>
          {p.entries.length === 0 && (
            <div className="bg-surface rounded-2xl border border-gray-100 p-8 flex flex-col items-center text-center">
              <CalendarDays size={32} className="text-gray-300 mb-2" />
              <p className="text-[14px] font-bold text-text-main font-display">Nenhum registro ainda</p>
              <p className="text-[11px] text-text-muted mt-1">Toque em + para lançar sua primeira reunião semanal.</p>
            </div>
          )}
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
            {p.entries.map((e) => {
              const ps = presStyle(e.presenca);
              return (
                <motion.div key={e.id} variants={fadeUp} className="bg-surface rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="h-1 w-full" style={{ backgroundColor: ps.color }} />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: ps.bg }}>
                          {e.presenca === "P" ? (
                            <Check size={18} color={ps.color} strokeWidth={2.5} />
                          ) : e.presenca === "Subs" ? (
                            <UserCheck size={18} color={ps.color} strokeWidth={2} />
                          ) : (
                            <X size={18} color={ps.color} strokeWidth={2.5} />
                          )}
                        </div>
                        <div>
                          <p className="text-[14px] font-extrabold text-text-main leading-tight font-display">
                            {e.dataLabel}
                          </p>
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full mt-1" style={{ backgroundColor: ps.bg }}>
                            <span className="text-[10px] font-bold" style={{ color: ps.color }}>
                              {ps.label}
                              {e.atrasado ? " · Atraso" : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                      {e.onf > 0 && (
                        <div className="text-right flex-shrink-0">
                          <p className="text-[13px] font-extrabold text-amber-500 font-display">
                            R${e.onf.toLocaleString("pt-BR")}
                          </p>
                          <p className="text-[9px] text-text-muted">ONF</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-50 grid grid-cols-4 gap-2">
                      {[
                        { label: "Refs", value: e.refs, color: e.refs > 0 ? "#22C55E" : "#8A8A8E" },
                        { label: "1-a-1", value: e.reunioes1a1, color: e.reunioes1a1 > 0 ? "#8B5CF6" : "#8A8A8E" },
                        { label: "Conv.", value: e.convidados, color: e.convidados > 0 ? "#0EA5E9" : "#8A8A8E" },
                        { label: "UEG", value: e.ueg ? 1 : 0, color: e.ueg ? "#22C55E" : "#8A8A8E" },
                      ].map((c) => (
                        <div key={c.label} className="flex flex-col items-center gap-0.5">
                          <span className="text-[14px] font-extrabold leading-none font-display" style={{ color: c.color }}>
                            {c.value}
                          </span>
                          <span className="text-[9px] text-text-muted font-semibold">{c.label}</span>
                        </div>
                      ))}
                    </div>
                    {e.observacoes && (
                      <p className="text-[11px] text-text-muted mt-2.5 leading-relaxed">{e.observacoes}</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
