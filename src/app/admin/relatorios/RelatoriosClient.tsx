"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FileUp, Trash2, FileCheck2 } from "lucide-react";

type Report = { id: string; month: number; year: number; count: number; importedAt: string };

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function RelatoriosClient({ reports }: { reports: Report[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState("");

  async function upload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return setError("Selecione o PDF Semáforos.");
    setUploading(true);
    setError("");
    setResult("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("month", String(month));
      fd.append("year", String(year));
      const res = await fetch("/api/admin/reports", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao importar.");
        return;
      }
      setResult(
        `${data.totalFound} membros lidos · ${data.matched} vinculados` +
          (data.unmatched.length > 0 ? ` · Sem cadastro: ${data.unmatched.join(", ")}` : "")
      );
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Excluir este relatório e todos os dados dele?")) return;
    await fetch(`/api/admin/reports/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Upload */}
      <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#FFF1F1] flex items-center justify-center">
            <FileUp size={17} color="#CC0000" />
          </div>
          <div>
            <p className="text-[14px] font-extrabold text-text-main font-display">Importar PDF Semáforos</p>
            <p className="text-[10px] text-text-muted">O mesmo relatório mensal usado no BNI Performance Tool</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select
            className="bg-background rounded-xl px-3.5 py-3 text-[13px] font-semibold outline-none"
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
          >
            {MESES.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            className="bg-background rounded-xl px-3.5 py-3 text-[13px] font-semibold outline-none"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
          >
            {Array.from({ length: 4 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          className="w-full text-[12px] text-text-muted file:mr-3 file:px-4 file:py-2.5 file:rounded-xl file:border-0 file:bg-background file:text-[12px] file:font-bold file:text-text-main"
        />
        {error && <p className="text-[12px] font-semibold text-primary bg-[#FFF1F1] rounded-xl px-3 py-2">{error}</p>}
        {result && <p className="text-[12px] font-semibold text-green-700 bg-green-50 rounded-xl px-3 py-2">{result}</p>}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={upload}
          disabled={uploading}
          className="w-full h-12 rounded-2xl bg-primary flex items-center justify-center gap-2 touch-manipulation disabled:opacity-60"
        >
          <FileUp size={16} color="white" strokeWidth={2.5} />
          <span className="text-white font-bold text-[14px]">{uploading ? "Processando..." : "Importar relatório"}</span>
        </motion.button>
      </div>

      {/* Histórico */}
      <p className="text-[12px] font-extrabold uppercase tracking-wider text-text-muted font-display">
        Relatórios importados ({reports.length})
      </p>
      {reports.length >= 6 && (
        <p className="text-[11px] font-semibold text-green-700 bg-green-50 rounded-xl px-3 py-2">
          ✓ 6+ meses de dados — projeções de caducidade em precisão máxima.
        </p>
      )}
      {reports.map((r) => (
        <div key={r.id} className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <FileCheck2 size={17} color="#16A34A" />
            </div>
            <div>
              <p className="text-[14px] font-extrabold text-text-main font-display">
                {MESES[r.month - 1]} {r.year}
              </p>
              <p className="text-[10px] text-text-muted">
                {r.count} membros · importado em {new Date(r.importedAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>
          <button
            onClick={() => remove(r.id)}
            className="w-9 h-9 rounded-full bg-background flex items-center justify-center touch-manipulation"
          >
            <Trash2 size={15} className="text-text-muted" />
          </button>
        </div>
      ))}
    </div>
  );
}
