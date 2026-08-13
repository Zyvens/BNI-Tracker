"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => void;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function InstallPwaButton() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || !promptEvent) return null;

  async function install() {
    promptEvent!.prompt();
    await promptEvent!.userChoice;
    setPromptEvent(null);
  }

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={install}
      className="w-full bg-surface rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3.5 touch-manipulation text-left"
    >
      <div className="w-10 h-10 rounded-xl bg-[var(--tint-red-bg)] flex items-center justify-center flex-shrink-0">
        <Download size={17} color="#CC0000" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-extrabold text-text-main font-display">Instalar o app</p>
        <p className="text-[10.5px] text-text-muted mt-0.5 leading-snug">
          Adicione o BNI Tracker à tela inicial do seu celular para acesso rápido
        </p>
      </div>
    </motion.button>
  );
}
