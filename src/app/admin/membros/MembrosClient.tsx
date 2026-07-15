"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, KeyRound, UserX, UserCheck } from "lucide-react";

type Member = {
  id: string;
  name: string;
  email: string | null;
  whatsapp: string | null;
  company: string | null;
  category: string | null;
  active: boolean;
  username: string | null;
  pendingPassword: boolean;
};

const input =
  "w-full bg-background rounded-xl px-3.5 py-3 text-[13px] font-semibold outline-none border-2 border-transparent focus:border-primary transition-colors";

export default function MembrosClient({ members }: { members: Member[] }) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [resetFor, setResetFor] = useState<Member | null>(null);
  const [busy, setBusy] = useState(false);

  async function toggleActive(m: Member) {
    setBusy(true);
    try {
      await fetch(`/api/admin/members/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !m.active }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-4 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-extrabold uppercase tracking-wider text-text-muted font-display">
          Membros ({members.length})
        </p>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full touch-manipulation"
          style={{ backgroundColor: "#FFF1F1" }}
        >
          <Plus size={14} color="#CC0000" strokeWidth={2.5} />
          <span className="text-[11px] font-bold text-primary">Cadastrar membro</span>
        </motion.button>
      </div>

      {members.map((m) => (
        <div
          key={m.id}
          className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-4"
          style={{ opacity: m.active ? 1 : 0.55 }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[14px] font-extrabold text-text-main font-display truncate">{m.name}</p>
              <p className="text-[11px] text-text-muted truncate">
                {m.username ? `@${m.username}` : "sem login"}
                {m.pendingPassword && m.username ? " · senha inicial pendente" : ""}
                {m.category ? ` · ${m.category}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                title="Redefinir senha"
                onClick={() => setResetFor(m)}
                className="w-9 h-9 rounded-full bg-background flex items-center justify-center touch-manipulation"
              >
                <KeyRound size={15} className="text-text-muted" />
              </button>
              <button
                title={m.active ? "Desativar" : "Reativar"}
                disabled={busy}
                onClick={() => toggleActive(m)}
                className="w-9 h-9 rounded-full flex items-center justify-center touch-manipulation"
                style={{ backgroundColor: m.active ? "#FFF1F1" : "#F0FDF4" }}
              >
                {m.active ? <UserX size={15} color="#CC0000" /> : <UserCheck size={15} color="#16A34A" />}
              </button>
            </div>
          </div>
        </div>
      ))}

      <AnimatePresence>
        {showNew && (
          <NewMemberSheet
            onClose={() => setShowNew(false)}
            onSaved={() => {
              setShowNew(false);
              router.refresh();
            }}
          />
        )}
        {resetFor && (
          <ResetPasswordSheet
            member={resetFor}
            onClose={() => setResetFor(null)}
            onSaved={() => {
              setResetFor(null);
              router.refresh();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
        className="w-full max-w-3xl bg-surface rounded-t-3xl overflow-hidden max-h-[92dvh] flex flex-col"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="text-[16px] font-extrabold text-text-main font-display">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-background flex items-center justify-center touch-manipulation">
            <X size={16} className="text-text-muted" strokeWidth={2.5} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3.5 overflow-y-auto">{children}</div>
      </motion.div>
    </motion.div>
  );
}

function NewMemberSheet({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    if (!name.trim() || !username.trim() || password.length < 6) {
      return setError("Preencha nome, usuário e uma senha inicial com 6+ caracteres.");
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, whatsapp, username, password }),
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
    <Sheet title="Cadastrar Membro" onClose={onClose}>
      <p className="text-[11px] text-text-muted -mt-1">
        Importante: o nome deve ser idêntico ao que aparece no PDF Semáforos para o vínculo automático.
      </p>
      <input className={input} placeholder="Nome completo (igual ao PDF) *" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <input className={input} placeholder="Categoria" value={category} onChange={(e) => setCategory(e.target.value)} />
        <input className={input} placeholder="WhatsApp" inputMode="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input className={input} placeholder="Usuário (login) *" autoCapitalize="none" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input className={input} placeholder="Senha inicial *" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <p className="text-[10px] text-text-muted">O membro trocará a senha no primeiro acesso.</p>
      {error && <p className="text-[12px] font-semibold text-primary bg-[#FFF1F1] rounded-xl px-3 py-2">{error}</p>}
      <div className="flex gap-3 pb-4">
        <motion.button whileTap={{ scale: 0.96 }} onClick={onClose} className="flex-1 h-12 rounded-2xl bg-background flex items-center justify-center touch-manipulation">
          <span className="text-text-muted font-semibold text-[14px]">Cancelar</span>
        </motion.button>
        <motion.button whileTap={{ scale: 0.96 }} onClick={submit} disabled={saving} className="flex-1 h-12 rounded-2xl bg-primary flex items-center justify-center touch-manipulation disabled:opacity-60">
          <span className="text-white font-bold text-[14px]">{saving ? "Salvando..." : "Criar acesso"}</span>
        </motion.button>
      </div>
    </Sheet>
  );
}

function ResetPasswordSheet({ member, onClose, onSaved }: { member: Member; onClose: () => void; onSaved: () => void }) {
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (password.length < 6) return setError("A senha deve ter 6+ caracteres.");
    setSaving(true);
    try {
      await fetch(`/api/admin/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: password }),
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet title={`Redefinir senha — ${member.name}`} onClose={onClose}>
      <input className={input} placeholder="Nova senha temporária" value={password} onChange={(e) => setPassword(e.target.value)} />
      <p className="text-[10px] text-text-muted">O membro deverá trocá-la no próximo acesso.</p>
      {error && <p className="text-[12px] font-semibold text-primary bg-[#FFF1F1] rounded-xl px-3 py-2">{error}</p>}
      <div className="flex gap-3 pb-4">
        <motion.button whileTap={{ scale: 0.96 }} onClick={onClose} className="flex-1 h-12 rounded-2xl bg-background flex items-center justify-center touch-manipulation">
          <span className="text-text-muted font-semibold text-[14px]">Cancelar</span>
        </motion.button>
        <motion.button whileTap={{ scale: 0.96 }} onClick={submit} disabled={saving} className="flex-1 h-12 rounded-2xl bg-primary flex items-center justify-center touch-manipulation disabled:opacity-60">
          <span className="text-white font-bold text-[14px]">{saving ? "Salvando..." : "Redefinir"}</span>
        </motion.button>
      </div>
    </Sheet>
  );
}
