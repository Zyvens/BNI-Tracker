"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  KeyRound,
  Trash2,
  Pencil,
  Send,
  Upload,
  Download,
  Copy,
  Check,
  MessageCircle,
  AlertTriangle,
} from "lucide-react";

type Member = {
  id: string;
  name: string;
  whatsapp: string | null;
  category: string | null;
  active: boolean;
  username: string | null;
  pendingPassword: boolean;
};

type Creds = { username: string; password: string };

const input =
  "w-full bg-background rounded-xl px-3.5 py-3 text-[13px] font-semibold outline-none border-2 border-transparent focus:border-primary transition-colors";

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

function buildMessage(name: string, username: string, password: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `Olá, ${firstName(name)}! 👋\n\nSeu acesso ao *BNI Tracker* foi criado:\n\n🔗 Link: ${origin}/login\n👤 Usuário: ${username}\n🔑 Senha: ${password}\n\nNo primeiro acesso, você vai poder criar uma nova senha.`;
}

function downloadCsv(members: Member[]) {
  const header = ["Nome", "Usuário", "WhatsApp", "Categoria", "Status"];
  const rows = members.map((m) => [
    m.name,
    m.username ?? "",
    m.whatsapp ?? "",
    m.category ?? "",
    m.active ? "Ativo" : "Inativo",
  ]);
  const csv = [header, ...rows]
    .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `membros-bni-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function MembrosClient({ members }: { members: Member[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [showNew, setShowNew] = useState(false);
  const [editFor, setEditFor] = useState<Member | null>(null);
  const [resetConfirmFor, setResetConfirmFor] = useState<Member | null>(null);
  const [deleteConfirmFor, setDeleteConfirmFor] = useState<Member | null>(null);
  const [sendFor, setSendFor] = useState<{ member: Member; creds: Creds } | null>(null);
  const [needsResetToSend, setNeedsResetToSend] = useState<Member | null>(null);
  const [importResult, setImportResult] = useState<{
    created: { name: string; username: string; password: string }[];
    skipped: { name: string; reason: string }[];
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const [busy, setBusy] = useState(false);

  // Senhas geradas nesta sessão (criação/reset) — nunca persistidas, só em memória do navegador.
  const [credentials, setCredentials] = useState<Record<string, Creds>>({});

  function openSend(m: Member) {
    const cached = credentials[m.id];
    if (cached) setSendFor({ member: m, creds: cached });
    else setNeedsResetToSend(m);
  }

  async function doResetPassword(m: Member, thenSend: boolean) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/members/${m.id}/reset-password`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) return;
      setCredentials((c) => ({ ...c, [m.id]: data }));
      setResetConfirmFor(null);
      setNeedsResetToSend(null);
      if (thenSend) setSendFor({ member: m, creds: data });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function doDelete(m: Member) {
    setBusy(true);
    try {
      await fetch(`/api/admin/members/${m.id}`, { method: "DELETE" });
      setDeleteConfirmFor(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/members/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao importar o arquivo.");
        return;
      }
      setImportResult(data);
      router.refresh();
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  return (
    <div className="px-4 py-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-[12px] font-extrabold uppercase tracking-wider text-text-muted font-display">
          Membros ({members.length})
        </p>
        <div className="flex items-center gap-1.5">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleImportFile}
          />
          <button
            title="Importar CSV"
            disabled={importing}
            onClick={() => fileRef.current?.click()}
            className="w-9 h-9 rounded-full bg-background flex items-center justify-center touch-manipulation disabled:opacity-60"
          >
            <Upload size={15} className="text-text-muted" />
          </button>
          <button
            title="Exportar CSV"
            onClick={() => downloadCsv(members)}
            className="w-9 h-9 rounded-full bg-background flex items-center justify-center touch-manipulation"
          >
            <Download size={15} className="text-text-muted" />
          </button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full touch-manipulation flex-shrink-0"
            style={{ backgroundColor: "#FFF1F1" }}
          >
            <Plus size={14} color="#CC0000" strokeWidth={2.5} />
            <span className="text-[11px] font-bold text-primary">Cadastrar membro</span>
          </motion.button>
        </div>
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
                {!m.active ? " · inativo" : ""}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                title="Editar dados"
                onClick={() => setEditFor(m)}
                className="w-9 h-9 rounded-full bg-background flex items-center justify-center touch-manipulation"
              >
                <Pencil size={15} className="text-text-muted" />
              </button>
              <button
                title="Gerar nova senha"
                onClick={() => setResetConfirmFor(m)}
                className="w-9 h-9 rounded-full bg-background flex items-center justify-center touch-manipulation"
              >
                <KeyRound size={15} className="text-text-muted" />
              </button>
              <button
                title="Enviar acesso"
                onClick={() => openSend(m)}
                className="w-9 h-9 rounded-full flex items-center justify-center touch-manipulation"
                style={{ backgroundColor: "#F0FDF4" }}
              >
                <Send size={15} color="#16A34A" />
              </button>
              <button
                title="Excluir membro"
                onClick={() => setDeleteConfirmFor(m)}
                className="w-9 h-9 rounded-full flex items-center justify-center touch-manipulation"
                style={{ backgroundColor: "#FFF1F1" }}
              >
                <Trash2 size={15} color="#CC0000" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {members.length === 0 && (
        <div className="bg-surface rounded-2xl border border-gray-100 p-8 flex flex-col items-center text-center">
          <p className="text-[14px] font-bold text-text-main font-display">Nenhum membro cadastrado</p>
          <p className="text-[11px] text-text-muted mt-1">
            Importe um relatório primeiro, ou cadastre membros manualmente.
          </p>
        </div>
      )}

      <AnimatePresence>
        {showNew && (
          <NewMemberSheet
            onClose={() => setShowNew(false)}
            onCreated={(member, creds) => {
              setCredentials((c) => ({ ...c, [member.id]: creds }));
              setShowNew(false);
              setSendFor({ member, creds });
              router.refresh();
            }}
          />
        )}

        {editFor && (
          <EditMemberSheet
            member={editFor}
            onClose={() => setEditFor(null)}
            onSaved={() => {
              setEditFor(null);
              router.refresh();
            }}
          />
        )}

        {resetConfirmFor && (
          <ConfirmSheet
            title="Gerar nova senha"
            message={`Gerar uma nova senha para ${resetConfirmFor.name}? A senha atual deixará de funcionar imediatamente.`}
            confirmLabel="Gerar nova senha"
            busy={busy}
            onCancel={() => setResetConfirmFor(null)}
            onConfirm={() => doResetPassword(resetConfirmFor, true)}
          />
        )}

        {needsResetToSend && (
          <ConfirmSheet
            title="Gerar senha para enviar"
            message={`Por segurança, senhas não ficam salvas em texto. Para enviar o acesso de ${needsResetToSend.name}, é preciso gerar uma nova senha agora. Continuar?`}
            confirmLabel="Gerar e enviar"
            busy={busy}
            onCancel={() => setNeedsResetToSend(null)}
            onConfirm={() => doResetPassword(needsResetToSend, true)}
          />
        )}

        {deleteConfirmFor && (
          <ConfirmSheet
            danger
            title="Excluir membro"
            message={`Excluir ${deleteConfirmFor.name}? Essa ação não pode ser desfeita — o login e os dados vinculados serão removidos.`}
            confirmLabel="Excluir"
            busy={busy}
            onCancel={() => setDeleteConfirmFor(null)}
            onConfirm={() => doDelete(deleteConfirmFor)}
          />
        )}

        {sendFor && (
          <CredentialsSheet
            member={sendFor.member}
            creds={sendFor.creds}
            onClose={() => setSendFor(null)}
          />
        )}

        {importResult && (
          <ImportResultSheet result={importResult} onClose={() => setImportResult(null)} />
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

function NewMemberSheet({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (member: Member, creds: Creds) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [candidates, setCandidates] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/report-names")
      .then((r) => r.json())
      .then((data) => setCandidates(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const filtered = candidates.filter((c) => c.toLowerCase().includes(name.trim().toLowerCase()));

  async function submit() {
    setError("");
    if (!name.trim()) return setError("Informe o nome do membro.");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, whatsapp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao salvar.");
        return;
      }
      const member: Member = {
        id: data.member.id,
        name: data.member.name,
        whatsapp: data.member.whatsapp,
        category: data.member.category,
        active: true,
        username: data.username,
        pendingPassword: true,
      };
      onCreated(member, { username: data.username, password: data.password });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet title="Cadastrar Membro" onClose={onClose}>
      <p className="text-[11px] text-text-muted -mt-1">
        Selecione um nome já visto nos relatórios importados, ou digite um novo.
      </p>
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1.5 block">
          Nome completo *
        </label>
        <div className="relative">
          <input
            className={input}
            placeholder="Toque para ver os nomes dos relatórios"
            value={name}
            onFocus={() => setShowSuggestions(true)}
            onChange={(e) => {
              setName(e.target.value);
              setShowSuggestions(true);
            }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          />
          {showSuggestions && filtered.length > 0 && (
            <div className="absolute z-10 left-0 right-0 mt-1 bg-surface rounded-xl shadow-lg border border-gray-100 max-h-48 overflow-y-auto">
              {filtered.map((c) => (
                <button
                  key={c}
                  type="button"
                  onMouseDown={() => {
                    setName(c);
                    setShowSuggestions(false);
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-[13px] font-semibold hover:bg-background touch-manipulation"
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input
          className={input}
          placeholder="Categoria (opcional)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <input
          className={input}
          placeholder="WhatsApp"
          inputMode="tel"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
        />
      </div>
      <p className="text-[10px] text-text-muted">
        Usuário e senha são gerados automaticamente. Você poderá enviá-los ao membro na tela seguinte.
      </p>
      {error && <p className="text-[12px] font-semibold text-primary bg-[#FFF1F1] rounded-xl px-3 py-2">{error}</p>}
      <div className="flex gap-3 pb-4">
        <motion.button whileTap={{ scale: 0.96 }} onClick={onClose} className="flex-1 h-12 rounded-2xl bg-background flex items-center justify-center touch-manipulation">
          <span className="text-text-muted font-semibold text-[14px]">Cancelar</span>
        </motion.button>
        <motion.button whileTap={{ scale: 0.96 }} onClick={submit} disabled={saving} className="flex-1 h-12 rounded-2xl bg-primary flex items-center justify-center touch-manipulation disabled:opacity-60">
          <span className="text-white font-bold text-[14px]">{saving ? "Criando..." : "Criar acesso"}</span>
        </motion.button>
      </div>
    </Sheet>
  );
}

function EditMemberSheet({
  member,
  onClose,
  onSaved,
}: {
  member: Member;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(member.name);
  const [category, setCategory] = useState(member.category || "");
  const [whatsapp, setWhatsapp] = useState(member.whatsapp || "");
  const [active, setActive] = useState(member.active);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!name.trim()) return setError("Informe o nome.");
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, whatsapp, active }),
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
    <Sheet title="Editar Membro" onClose={onClose}>
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1.5 block">
          Nome completo
        </label>
        <input className={input} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input className={input} placeholder="Categoria (opcional)" value={category} onChange={(e) => setCategory(e.target.value)} />
        <input className={input} placeholder="WhatsApp" inputMode="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
      </div>
      <button
        type="button"
        onClick={() => setActive(!active)}
        className="flex items-center justify-between w-full py-2 touch-manipulation"
      >
        <span className="text-[13px] font-semibold text-text-main">Membro ativo</span>
        <div
          className="w-11 h-6 rounded-full transition-colors relative"
          style={{ backgroundColor: active ? "#22C55E" : "#E5E7EB" }}
        >
          <motion.div
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
            animate={{ left: active ? 22 : 2 }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
          />
        </div>
      </button>
      {error && <p className="text-[12px] font-semibold text-primary bg-[#FFF1F1] rounded-xl px-3 py-2">{error}</p>}
      <div className="flex gap-3 pb-4">
        <motion.button whileTap={{ scale: 0.96 }} onClick={onClose} className="flex-1 h-12 rounded-2xl bg-background flex items-center justify-center touch-manipulation">
          <span className="text-text-muted font-semibold text-[14px]">Cancelar</span>
        </motion.button>
        <motion.button whileTap={{ scale: 0.96 }} onClick={submit} disabled={saving} className="flex-1 h-12 rounded-2xl bg-primary flex items-center justify-center touch-manipulation disabled:opacity-60">
          <span className="text-white font-bold text-[14px]">{saving ? "Salvando..." : "Salvar"}</span>
        </motion.button>
      </div>
    </Sheet>
  );
}

function ConfirmSheet({
  title,
  message,
  confirmLabel,
  busy,
  danger,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  busy: boolean;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Sheet title={title} onClose={onCancel}>
      <div className="flex items-start gap-2.5 bg-background rounded-xl px-3.5 py-3">
        <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" color={danger ? "#CC0000" : "#D97706"} />
        <p className="text-[13px] text-text-main leading-relaxed">{message}</p>
      </div>
      <div className="flex gap-3 pb-4">
        <motion.button whileTap={{ scale: 0.96 }} onClick={onCancel} className="flex-1 h-12 rounded-2xl bg-background flex items-center justify-center touch-manipulation">
          <span className="text-text-muted font-semibold text-[14px]">Cancelar</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onConfirm}
          disabled={busy}
          className="flex-1 h-12 rounded-2xl flex items-center justify-center touch-manipulation disabled:opacity-60"
          style={{ backgroundColor: danger ? "#CC0000" : "#D97706" }}
        >
          <span className="text-white font-bold text-[14px]">{busy ? "Aguarde..." : confirmLabel}</span>
        </motion.button>
      </div>
    </Sheet>
  );
}

function CredentialsSheet({
  member,
  creds,
  onClose,
}: {
  member: Member;
  creds: Creds;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const message = buildMessage(member.name, creds.username, creds.password);
  const waLink = member.whatsapp
    ? `https://wa.me/55${member.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`
    : null;

  async function copy() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Sheet title={`Enviar acesso — ${member.name}`} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-background rounded-xl px-3.5 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Usuário</p>
          <p className="text-[14px] font-extrabold text-text-main font-display">{creds.username}</p>
        </div>
        <div className="bg-background rounded-xl px-3.5 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Senha</p>
          <p className="text-[14px] font-extrabold text-text-main font-display">{creds.password}</p>
        </div>
      </div>
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1.5 block">
          Mensagem pronta
        </label>
        <textarea readOnly rows={7} value={message} className={`${input} resize-none font-body`} />
      </div>
      {copied && (
        <p className="text-[12px] font-semibold text-green-700 bg-green-50 rounded-xl px-3 py-2">
          Mensagem copiada!
        </p>
      )}
      <div className="flex gap-3 pb-4">
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 touch-manipulation"
            style={{ backgroundColor: "#22C55E" }}
          >
            <MessageCircle size={16} color="white" />
            <span className="text-white font-bold text-[13px]">Abrir WhatsApp</span>
          </a>
        )}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={copy}
          className="flex-1 h-12 rounded-2xl bg-primary flex items-center justify-center gap-2 touch-manipulation"
        >
          {copied ? <Check size={16} color="white" /> : <Copy size={16} color="white" />}
          <span className="text-white font-bold text-[13px]">Copiar mensagem</span>
        </motion.button>
      </div>
    </Sheet>
  );
}

function ImportResultSheet({
  result,
  onClose,
}: {
  result: { created: { name: string; username: string; password: string }[]; skipped: { name: string; reason: string }[] };
  onClose: () => void;
}) {
  const [copiedAll, setCopiedAll] = useState(false);

  async function copyAll() {
    const text = result.created
      .map((c) => buildMessage(c.name, c.username, c.password))
      .join("\n\n———\n\n");
    await navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }

  return (
    <Sheet title="Importação concluída" onClose={onClose}>
      <p className="text-[13px] font-semibold text-text-main">
        {result.created.length} membro(s) criado(s)
        {result.skipped.length > 0 ? `, ${result.skipped.length} ignorado(s)` : ""}.
      </p>

      {result.created.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Acessos gerados</p>
          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            {result.created.map((c) => (
              <div key={c.username} className="bg-background rounded-xl px-3 py-2.5">
                <p className="text-[13px] font-bold text-text-main truncate">{c.name}</p>
                <p className="text-[11px] text-text-muted">
                  @{c.username} · {c.password}
                </p>
              </div>
            ))}
          </div>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={copyAll}
            className="w-full h-11 rounded-2xl bg-primary flex items-center justify-center gap-2 touch-manipulation"
          >
            {copiedAll ? <Check size={15} color="white" /> : <Copy size={15} color="white" />}
            <span className="text-white font-bold text-[13px]">
              {copiedAll ? "Copiado!" : "Copiar todas as mensagens de acesso"}
            </span>
          </motion.button>
        </div>
      )}

      {result.skipped.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Ignorados</p>
          {result.skipped.map((s, i) => (
            <p key={i} className="text-[12px] text-text-muted">
              {s.name} — {s.reason}
            </p>
          ))}
        </div>
      )}

      <button onClick={onClose} className="w-full h-11 rounded-2xl bg-background flex items-center justify-center touch-manipulation">
        <span className="text-text-muted font-semibold text-[14px]">Fechar</span>
      </button>
    </Sheet>
  );
}
