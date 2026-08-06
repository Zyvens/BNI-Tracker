"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, User, LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao entrar.");
        return;
      }
      if (data.mustChangePassword) router.push("/trocar-senha");
      else if (data.role === "ADMIN") router.push("/admin");
      else router.push("/");
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
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-primary mx-auto mb-4 flex items-center justify-center shadow-lg shadow-red-200">
            <span className="text-white font-extrabold text-2xl font-display">B</span>
          </div>
          <h1 className="text-2xl font-extrabold text-text-main font-display">BNI Tracker</h1>
          <p className="text-[13px] text-text-muted mt-1">
            Seu assistente estratégico rumo aos 100 pontos
          </p>
        </div>

        <form onSubmit={submit} className="bg-surface rounded-3xl shadow-sm border border-gray-100 p-5 space-y-4">
          <div>
            <label className="text-[12px] font-bold uppercase tracking-wider text-text-muted mb-1.5 block">
              Usuário
            </label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                className="w-full bg-background rounded-2xl pl-11 pr-4 py-3.5 text-[15px] font-semibold outline-none border-2 border-transparent focus:border-primary transition-colors"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoCapitalize="none"
                autoComplete="username"
              />
            </div>
          </div>
          <div>
            <label className="text-[12px] font-bold uppercase tracking-wider text-text-muted mb-1.5 block">
              Senha
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="password"
                className="w-full bg-background rounded-2xl pl-11 pr-4 py-3.5 text-[15px] font-semibold outline-none border-2 border-transparent focus:border-primary transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>
          {error && (
            <p className="text-[12px] font-semibold text-primary bg-[#FFF1F1] rounded-xl px-3 py-2">{error}</p>
          )}
          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-primary flex items-center justify-center gap-2 touch-manipulation disabled:opacity-60"
          >
            <LogIn size={16} color="white" strokeWidth={2.5} />
            <span className="text-white font-bold text-[14px]">
              {loading ? "Entrando..." : "Entrar"}
            </span>
          </motion.button>
        </form>

        <p className="text-center text-[11px] text-text-muted mt-6">
          Acesso criado pelo Coordenador de Performance da sua equipe.
        </p>
      </motion.div>
    </div>
  );
}
