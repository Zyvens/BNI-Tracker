"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { KeyRound } from "lucide-react";

export default function TrocarSenhaPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError("A senha deve ter pelo menos 6 caracteres.");
    if (password !== confirm) return setError("As senhas não conferem.");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao salvar.");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-3xl bg-[var(--tint-red-bg)] mx-auto mb-3 flex items-center justify-center">
            <KeyRound size={24} color="#CC0000" />
          </div>
          <h1 className="text-xl font-extrabold text-text-main font-display">Defina sua nova senha</h1>
          <p className="text-[12px] text-text-muted mt-1">
            Por segurança, troque a senha inicial fornecida pelo coordenador.
          </p>
        </div>
        <form onSubmit={submit} className="bg-surface rounded-3xl shadow-sm border border-gray-100 p-5 space-y-4">
          <input
            type="password"
            placeholder="Nova senha"
            className="w-full bg-background rounded-2xl px-4 py-3.5 text-[15px] font-semibold outline-none border-2 border-transparent focus:border-primary transition-colors"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirmar nova senha"
            className="w-full bg-background rounded-2xl px-4 py-3.5 text-[15px] font-semibold outline-none border-2 border-transparent focus:border-primary transition-colors"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {error && (
            <p className="text-[12px] font-semibold text-primary bg-[var(--tint-red-bg)] rounded-xl px-3 py-2">{error}</p>
          )}
          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-primary flex items-center justify-center touch-manipulation disabled:opacity-60"
          >
            <span className="text-white font-bold text-[14px]">
              {loading ? "Salvando..." : "Salvar e continuar"}
            </span>
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
