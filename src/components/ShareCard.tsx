"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share2, Download, ShieldCheck } from "lucide-react";
import { fmtMoney } from "@/components/ui";

export type ShareCardData = {
  name: string;
  score: number;
  targetScore: number;
  windowLabel: string;
  presencas: number;
  totalReunioes: number;
  refsConvertidas: number;
  valorConvertido: number;
};

export default function ShareCardButton({ data }: { data: ShareCardData }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Compartilhar desempenho"
        className="w-9 h-9 rounded-full bg-background flex items-center justify-center touch-manipulation"
      >
        <Share2 size={16} color="var(--color-text-main)" strokeWidth={2} />
      </button>
      <AnimatePresence>{open && <ShareCardSheet data={data} onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
}

function ShareCardSheet({ data, onClose }: { data: ShareCardData; onClose: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const gold = data.score >= data.targetScore;

  async function renderPng(): Promise<string> {
    const { toPng } = await import("html-to-image");
    if (!cardRef.current) throw new Error("Card não encontrado");
    return toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
  }

  async function share() {
    setBusy(true);
    setError("");
    try {
      const dataUrl = await renderPng();
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "bni-desempenho.png", { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Meu desempenho no BNI",
          text: `${data.name} — ${data.score} pontos no BNI Tracker`,
        });
      } else {
        downloadDataUrl(dataUrl);
      }
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") setError("Não foi possível gerar a imagem.");
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    setBusy(true);
    setError("");
    try {
      downloadDataUrl(await renderPng());
    } catch {
      setError("Não foi possível gerar a imagem.");
    } finally {
      setBusy(false);
    }
  }

  function downloadDataUrl(dataUrl: string) {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "bni-desempenho.png";
    link.click();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
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
          <h2 className="text-[16px] font-extrabold text-text-main font-display">Compartilhar desempenho</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-background flex items-center justify-center touch-manipulation">
            <X size={16} color="#8A8A8E" strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-5 py-5 flex flex-col items-center">
          {/* Card renderizado (visível na tela e capturado pela imagem) */}
          <div
            ref={cardRef}
            className="w-full max-w-[340px] rounded-3xl overflow-hidden"
            style={{ background: "linear-gradient(160deg, #CC0000 0%, #8B0000 100%)", fontFamily: "system-ui, sans-serif" }}
          >
            <div className="px-6 pt-6 pb-5">
              <div className="flex items-center gap-1.5 mb-4">
                <ShieldCheck size={15} color="#FFD9D9" strokeWidth={2.4} />
                <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: "#FFD9D9" }}>
                  BNI Tracker
                </span>
              </div>
              <p className="text-[13px] font-bold" style={{ color: "#FFE5E5" }}>
                {data.name}
              </p>
              <p className="text-[10px] mb-4" style={{ color: "#FFB8B8" }}>
                {data.windowLabel}
              </p>

              <div className="flex items-end gap-2 mb-1">
                <span className="text-[56px] font-extrabold leading-none" style={{ color: "white" }}>
                  {data.score}
                </span>
                <span className="text-[16px] font-bold pb-2" style={{ color: "#FFCACA" }}>
                  / {data.targetScore} pts
                </span>
              </div>
              {gold && (
                <span className="inline-block text-[11px] font-extrabold px-2.5 py-1 rounded-full mb-3" style={{ backgroundColor: "#FDE68A", color: "#92400E" }}>
                  🏆 Clube 100
                </span>
              )}

              <div className="grid grid-cols-3 gap-2 mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.25)" }}>
                <div className="flex flex-col">
                  <span className="text-[18px] font-extrabold text-white leading-none">{data.presencas}</span>
                  <span className="text-[9px] font-semibold mt-1" style={{ color: "#FFCACA" }}>
                    Presenças
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[18px] font-extrabold text-white leading-none">{data.refsConvertidas}</span>
                  <span className="text-[9px] font-semibold mt-1" style={{ color: "#FFCACA" }}>
                    Refs. fechadas
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-extrabold text-white leading-none">{fmtMoney(data.valorConvertido, true)}</span>
                  <span className="text-[9px] font-semibold mt-1" style={{ color: "#FFCACA" }}>
                    Gerado
                  </span>
                </div>
              </div>
            </div>
          </div>

          {error && <p className="text-[11px] font-semibold text-primary mt-3">{error}</p>}

          <div className="flex gap-3 mt-5 w-full">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={download}
              disabled={busy}
              className="flex-1 h-12 rounded-2xl bg-background flex items-center justify-center gap-2 touch-manipulation disabled:opacity-60"
            >
              <Download size={16} className="text-text-main" strokeWidth={2.5} />
              <span className="text-text-main font-bold text-[14px]">Baixar</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={share}
              disabled={busy}
              className="flex-1 h-12 rounded-2xl bg-primary flex items-center justify-center gap-2 touch-manipulation disabled:opacity-60"
            >
              <Share2 size={16} color="white" strokeWidth={2.5} />
              <span className="text-white font-bold text-[14px]">{busy ? "Gerando..." : "Compartilhar"}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
