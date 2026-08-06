"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Inbox,
  Users,
  UserPlus,
  HeartHandshake,
  Handshake,
  Sparkles,
  Activity as ActivityIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  MapPin,
  Timer,
  X,
} from "lucide-react";
import type { FeedItem } from "@/lib/feed";
import LogoutButton from "@/components/LogoutButton";

const FILTERS = [
  { id: "todos", label: "Todos", shortLabel: "Todos" },
  { id: "dadas", label: "Ref. Dadas", shortLabel: "Dadas" },
  { id: "recebidas", label: "Ref. Recebidas", shortLabel: "Receb." },
  { id: "1a1", label: "1-a-1", shortLabel: "1-a-1" },
  { id: "agradecimentos", label: "Agradecimentos", shortLabel: "Agrad." },
];

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  convertida: { label: "Convertida", color: "#22C55E", bg: "#F0FDF4", icon: CheckCircle2 },
  em_andamento: { label: "Em andamento", color: "#F59E0B", bg: "#FFFBEB", icon: Clock },
  perdida: { label: "Perdida", color: "#CC0000", bg: "#FFF1F1", icon: AlertCircle },
  realizado: { label: "Realizado", color: "#22C55E", bg: "#F0FDF4", icon: CheckCircle2 },
  pendente: { label: "Pendente", color: "#F59E0B", bg: "#FFFBEB", icon: Clock },
};

function tipoStyle(tipo: string) {
  switch (tipo) {
    case "dada":
      return { label: "Ref. Dada", color: "#22C55E", bg: "#F0FDF4", icon: Send };
    case "recebida":
      return { label: "Ref. Recebida", color: "#CC0000", bg: "#FFF1F1", icon: Inbox };
    case "reuniao_1a1":
      return { label: "Reunião 1-a-1", color: "#8B5CF6", bg: "#F5F3FF", icon: Users };
    case "agradecimento_dado":
      return { label: "Agradecimento Dado", color: "#F59E0B", bg: "#FFFBEB", icon: HeartHandshake };
    case "agradecimento_recebido":
      return { label: "Agradecimento Recebido", color: "#0EA5E9", bg: "#F0F9FF", icon: HeartHandshake };
    default:
      return { label: "Atividade", color: "#8A8A8E", bg: "#F5F5F7", icon: ActivityIcon };
  }
}

function applyFilter(items: FeedItem[], filtro: string): FeedItem[] {
  switch (filtro) {
    case "dadas": return items.filter((i) => i.tipo === "dada");
    case "recebidas": return items.filter((i) => i.tipo === "recebida");
    case "1a1": return items.filter((i) => i.tipo === "reuniao_1a1");
    case "agradecimentos": return items.filter((i) => i.tipo.startsWith("agradecimento"));
    default: return items;
  }
}

export default function FeedClient({
  items,
  goal1a1,
  members,
}: {
  items: FeedItem[];
  goal1a1: number;
  members: { id: string; name: string }[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const initial = FILTERS.some((f) => f.id === params.get("filtro")) ? params.get("filtro")! : "todos";
  const [filtro, setFiltro] = useState(initial);
  const [showNew1a1, setShowNew1a1] = useState(false);

  const filtered = useMemo(() => applyFilter(items, filtro), [items, filtro]);

  const stats = useMemo(() => {
    if (filtro === "todos") {
      return [
        { label: "Ref. Dadas", value: items.filter((i) => i.tipo === "dada").length, color: "#22C55E" },
        { label: "Ref. Recebidas", value: items.filter((i) => i.tipo === "recebida").length, color: "#CC0000" },
        { label: "Reuniões 1-a-1", value: items.filter((i) => i.tipo === "reuniao_1a1").length, color: "#8B5CF6" },
        { label: "Agradecimentos", value: items.filter((i) => i.tipo.startsWith("agradecimento")).length, color: "#F59E0B" },
      ];
    }
    if (filtro === "dadas" || filtro === "recebidas") {
      const conv = filtered.filter((i) => i.status === "convertida").length;
      const and = filtered.filter((i) => ["em_andamento", "pendente"].includes(i.status)).length;
      const perd = filtered.filter((i) => i.status === "perdida").length;
      const total = filtered.reduce((s, i) => s + i.valor, 0);
      return [
        { label: "Convertidas", value: conv, color: "#22C55E" },
        { label: "Em Andamento", value: and, color: "#F59E0B" },
        { label: "Perdidas", value: perd, color: "#CC0000" },
        { label: `Total R$${(total / 1000).toFixed(1)}k`, value: filtered.length, color: "#1A1A1A" },
      ];
    }
    if (filtro === "1a1") {
      return [
        { label: "Realizadas", value: filtered.length, color: "#8B5CF6" },
        { label: "Meta semestral", value: goal1a1, color: "#1A1A1A" },
        { label: "Membros únicos", value: new Set(filtered.map((i) => i.nome)).size, color: "#22C55E" },
        { label: "", value: 0, color: "transparent" },
      ];
    }
    const dados = filtered.filter((i) => i.tipo === "agradecimento_dado").length;
    const recebidos = filtered.filter((i) => i.tipo === "agradecimento_recebido").length;
    return [
      { label: "Dados", value: dados, color: "#F59E0B" },
      { label: "Recebidos", value: recebidos, color: "#0EA5E9" },
      { label: "Total", value: filtered.length, color: "#1A1A1A" },
      { label: "", value: 0, color: "transparent" },
    ];
  }, [filtro, filtered, items, goal1a1]);

  const caption = {
    todos: "Todas as atividades · ordem cronológica",
    dadas: "Referências que você deu a membros BNI",
    recebidas: "Referências que membros BNI deram a você",
    "1a1": "Reuniões 1-a-1 realizadas no semestre",
    agradecimentos: "Agradecimentos por negócios fechados",
  }[filtro];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div
        className="bg-surface border-b border-gray-100 sticky top-0 z-30"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="px-4 h-14 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-[17px] font-extrabold text-text-main font-display truncate">Feed de Atividades</h1>
            <p className="text-[11px] text-text-muted truncate">{items.length} registros</p>
          </div>
          <LogoutButton />
        </div>
        {/* Registrar — todos os atalhos de inserção de dados, no mesmo padrão visual */}
        <div className="flex items-center justify-center gap-3 px-4 pb-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <QuickAction href="/referencias" icon={Send} label="Nova Ref." color="#CC0000" bg="#FFF1F1" />
          <QuickAction icon={Users} label="1-a-1" color="#8B5CF6" bg="#F5F3FF" onClick={() => setShowNew1a1(true)} />
          <QuickAction href="/convidados" icon={UserPlus} label="Convidados" color="#2563EB" bg="#EFF6FF" />
          <QuickAction href="/parceiros" icon={Handshake} label="Parceiros" color="#D97706" bg="#FFFBEB" />
          <QuickAction href="/possibilidades" icon={Sparkles} label="Possibilidade" color="#DB2777" bg="#FDF2F8" />
        </div>
        {/* Filtros */}
        <div className="flex items-center border-t border-gray-100 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {FILTERS.map((fdef) => {
            const active = filtro === fdef.id;
            return (
              <motion.button
                key={fdef.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => setFiltro(fdef.id)}
                className="flex-shrink-0 flex items-center justify-center px-4 h-11 touch-manipulation"
                style={{ backgroundColor: active ? "#CC0000" : "transparent" }}
              >
                <span className="text-[12px] font-bold whitespace-nowrap" style={{ color: active ? "white" : "#8A8A8E" }}>
                  {fdef.shortLabel}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={filtro}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {/* Estatísticas do filtro */}
          <div className="px-4 pt-4 pb-3">
            <div className="grid grid-cols-4 gap-2">
              {stats.map((s, i) =>
                s.label ? (
                  <div key={i} className="bg-surface rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col items-center gap-1 text-center">
                    <span className="text-[18px] font-extrabold leading-none font-display" style={{ color: s.color }}>
                      {s.value}
                    </span>
                    <span className="text-[9px] text-text-muted font-semibold leading-tight">{s.label}</span>
                  </div>
                ) : (
                  <div key={i} />
                )
              )}
            </div>
          </div>

          <div className="px-4 pb-2 pt-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{caption}</p>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-surface border border-gray-100 shadow-sm flex items-center justify-center">
                <ActivityIcon size={28} color="#8A8A8E" strokeWidth={1.5} />
              </div>
              <p className="text-[14px] font-bold text-text-main">Nenhum registro</p>
              <p className="text-[12px] text-text-muted text-center px-8">
                Não há atividades nesta categoria ainda.
              </p>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.045 } } }}
              className="pt-1"
            >
              {filtered.map((item) => (
                <FeedCard key={item.id} item={item} onClick={() => router.push(`/atividade/${item.id}`)} />
              ))}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showNew1a1 && (
          <New1a1Sheet
            members={members}
            onClose={() => setShowNew1a1(false)}
            onSaved={() => {
              setShowNew1a1(false);
              router.refresh();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Atalho de registro — mesmo padrão visual pra todos (ícone circular colorido + rótulo
// embaixo), seja ele um link de navegação ou uma ação local (abrir um sheet).
function QuickAction({
  icon: Icon,
  label,
  color,
  bg,
  href,
  onClick,
}: {
  icon: any;
  label: string;
  color: string;
  bg: string;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <motion.div whileTap={{ scale: 0.92 }} className="flex flex-col items-center gap-1 touch-manipulation flex-shrink-0" style={{ width: 64 }}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: bg }}>
        <Icon size={19} color={color} strokeWidth={2} />
      </div>
      <span className="text-[10px] font-bold text-text-main text-center leading-tight">{label}</span>
    </motion.div>
  );
  if (href) return <Link href={href}>{content}</Link>;
  return <button onClick={onClick}>{content}</button>;
}

function FeedCard({ item, onClick }: { item: FeedItem; onClick: () => void }) {
  const t = tipoStyle(item.tipo);
  const TIcon = t.icon;
  const st = STATUS_STYLE[item.status] ?? STATUS_STYLE.pendente;
  const SIcon = st.icon;
  const is1a1 = item.tipo === "reuniao_1a1";

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-surface rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer active:opacity-90 mx-4 mb-3"
    >
      <div className="h-1 w-full" style={{ backgroundColor: t.color }} />
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: t.bg }}>
            <TIcon size={20} color={t.color} strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: t.color }}>
                {t.label}
              </span>
              <span className="text-[10px] text-text-muted flex-shrink-0">{item.dataLabel}</span>
            </div>
            <p className="text-[14px] font-extrabold text-text-main leading-tight truncate font-display">
              {item.nome}
            </p>
            {item.segmento && <p className="text-[11px] text-text-muted mt-0.5">{item.segmento}</p>}
          </div>
          <svg width="7" height="12" viewBox="0 0 7 12" fill="none" className="flex-shrink-0 mt-1.5">
            <path d="M1 1l5 5-5 5" stroke="#CCCCCC" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between gap-2 flex-wrap">
          {!is1a1 && item.valor > 0 && (
            <div className="flex items-center gap-1.5">
              <DollarSign size={13} color={t.color} strokeWidth={2} />
              <span className="text-[14px] font-extrabold font-display" style={{ color: t.color }}>
                R${item.valor.toLocaleString("pt-BR")}
              </span>
            </div>
          )}
          {is1a1 && (
            <div className="flex items-center gap-3 flex-wrap">
              {item.local && (
                <div className="flex items-center gap-1">
                  <MapPin size={11} color="#8A8A8E" strokeWidth={2} />
                  <span className="text-[11px] text-text-muted truncate max-w-[140px]">{item.local}</span>
                </div>
              )}
              {item.duracao && (
                <div className="flex items-center gap-1">
                  <Timer size={11} color="#8B5CF6" strokeWidth={2} />
                  <span className="text-[11px] font-semibold" style={{ color: "#8B5CF6" }}>{item.duracao}</span>
                </div>
              )}
            </div>
          )}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: st.bg }}>
            <SIcon size={10} color={st.color} strokeWidth={2.5} />
            <span className="text-[10px] font-bold" style={{ color: st.color }}>{st.label}</span>
          </div>
        </div>
        {(item.motivoAgradecimento || item.observacoes) && (
          <div className="mt-2.5 px-3 py-2 rounded-xl" style={{ backgroundColor: t.bg + "60" }}>
            <p className="text-[11px] text-text-muted leading-relaxed line-clamp-2">
              {item.motivoAgradecimento || item.observacoes}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function New1a1Sheet({
  members,
  onClose,
  onSaved,
}: {
  members: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [withMemberId, setWithMemberId] = useState("");
  const [withName, setWithName] = useState("");
  const [dataISO, setDataISO] = useState(new Date().toISOString().slice(0, 10));
  const [local, setLocal] = useState("");
  const [duracao, setDuracao] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const input =
    "w-full bg-background rounded-xl px-3.5 py-3 text-[13px] font-semibold outline-none border-2 border-transparent focus:border-primary transition-colors";

  async function submit() {
    if (!withMemberId && !withName.trim()) return setError("Informe com quem foi a reunião.");
    setSaving(true);
    try {
      const res = await fetch("/api/one-to-ones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withMemberId: withMemberId || null, withName, dataISO, local, duracao, notes }),
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
        className="w-full bg-surface rounded-t-3xl overflow-hidden max-h-[92dvh] flex flex-col"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="text-[16px] font-extrabold text-text-main font-display">Registrar Reunião 1-a-1</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-background flex items-center justify-center touch-manipulation">
            <X size={16} color="#8A8A8E" strokeWidth={2.5} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3.5 overflow-y-auto">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1.5 block">Com quem?</label>
            <select className={input} value={withMemberId} onChange={(e) => setWithMemberId(e.target.value)}>
              <option value="">— Fora da equipe —</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          {!withMemberId && (
            <input className={input} placeholder="Nome da pessoa" value={withName} onChange={(e) => setWithName(e.target.value)} />
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-text-muted mb-1 block">Data</label>
              <input type="date" className={input} value={dataISO} onChange={(e) => setDataISO(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-text-muted mb-1 block">Duração</label>
              <input className={input} placeholder="1h" value={duracao} onChange={(e) => setDuracao(e.target.value)} />
            </div>
          </div>
          <input className={input} placeholder="Local (café, escritório...)" value={local} onChange={(e) => setLocal(e.target.value)} />
          <textarea rows={2} className={`${input} resize-none`} placeholder="Resultado da reunião, oportunidades..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          {error && <p className="text-[12px] font-semibold text-primary bg-[#FFF1F1] rounded-xl px-3 py-2">{error}</p>}
          <div className="flex gap-3 pb-4">
            <motion.button whileTap={{ scale: 0.96 }} onClick={onClose} className="flex-1 h-12 rounded-2xl bg-background flex items-center justify-center touch-manipulation">
              <span className="text-text-muted font-semibold text-[14px]">Cancelar</span>
            </motion.button>
            <motion.button whileTap={{ scale: 0.96 }} onClick={submit} disabled={saving} className="flex-1 h-12 rounded-2xl bg-primary flex items-center justify-center touch-manipulation disabled:opacity-60">
              <span className="text-white font-bold text-[14px]">{saving ? "Salvando..." : "Salvar"}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
