"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Send,
  Inbox,
  Users,
  HeartHandshake,
  Activity as ActivityIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  MapPin,
  Timer,
  CalendarDays,
  Tag,
  Briefcase,
  MessageCircle,
  Phone,
  Lightbulb,
  FileText,
  ExternalLink,
} from "lucide-react";
import type { FeedItem } from "@/lib/feed";

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  convertida: { label: "Convertida", color: "#22C55E", bg: "#F0FDF4", icon: CheckCircle2 },
  em_andamento: { label: "Em Andamento", color: "#F59E0B", bg: "#FFFBEB", icon: Clock },
  perdida: { label: "Perdida", color: "#CC0000", bg: "#FFF1F1", icon: AlertCircle },
  realizado: { label: "Realizado", color: "#22C55E", bg: "#F0FDF4", icon: CheckCircle2 },
  pendente: { label: "Pendente", color: "#F59E0B", bg: "#FFFBEB", icon: Clock },
};

const ORIGEM_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  direto: { label: "Referência Direta", color: "#CC0000", bg: "#FFF1F1" },
  clube_permuta: { label: "Clube de Permuta", color: "#8B5CF6", bg: "#F5F3FF" },
  parceria: { label: "Parceria Estratégica", color: "#0EA5E9", bg: "#F0F9FF" },
};

function tipoMeta(tipo: string) {
  switch (tipo) {
    case "dada":
      return { label: "Referência Dada", sublabel: "Você gerou valor para um membro", color: "#22C55E", bg: "#F0FDF4", Icon: Send, badgeLabel: "Dei" };
    case "recebida":
      return { label: "Referência Recebida", sublabel: "Um membro gerou valor para você", color: "#CC0000", bg: "#FFF1F1", Icon: Inbox, badgeLabel: "Recebi" };
    case "reuniao_1a1":
      return { label: "Reunião 1-a-1", sublabel: "Reunião de networking realizada", color: "#8B5CF6", bg: "#F5F3FF", Icon: Users, badgeLabel: "1-a-1" };
    case "agradecimento_dado":
      return { label: "Agradecimento Dado", sublabel: "Você agradeceu por negócio fechado", color: "#F59E0B", bg: "#FFFBEB", Icon: HeartHandshake, badgeLabel: "Agradeci" };
    default:
      return { label: "Agradecimento Recebido", sublabel: "Membro agradeceu a você", color: "#0EA5E9", bg: "#F0F9FF", Icon: HeartHandshake, badgeLabel: "Recebi" };
  }
}

function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(iso + "T00:00:00");
  return Math.ceil((d.getTime() - today.getTime()) / 86400000);
}

const longDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
const monthYear = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

export default function AtividadeClient({ item }: { item: FeedItem | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (!item) {
    return (
      <div className="flex flex-col min-h-[70dvh] items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-surface border border-gray-100 shadow-sm flex items-center justify-center mb-4">
          <AlertCircle size={28} color="#8A8A8E" strokeWidth={1.5} />
        </div>
        <p className="text-[15px] font-bold text-text-main mb-1">Registro não encontrado</p>
        <p className="text-[13px] text-text-muted mb-6">Este registro pode ter sido removido.</p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => router.back()}
          className="px-6 h-12 rounded-2xl bg-primary flex items-center justify-center touch-manipulation"
        >
          <span className="text-white font-bold text-[14px]">Voltar</span>
        </motion.button>
      </div>
    );
  }

  const t = tipoMeta(item.tipo);
  const st = STATUS_STYLE[item.status] ?? STATUS_STYLE.pendente;
  const SIcon = st.icon;
  const origem = item.origem ? ORIGEM_STYLE[item.origem] : null;
  const days = item.expiracaoISO ? daysUntil(item.expiracaoISO) : null;
  const expired = days !== null && days < 0;
  const urgent = days !== null && days >= 0 && days <= 7;
  const is1a1 = item.tipo === "reuniao_1a1";
  const isAgrad = item.tipo.startsWith("agradecimento");
  const isRef = item.tipo === "dada" || item.tipo === "recebida";

  async function marcarConvertida() {
    if (!item?.referralId) return;
    setBusy(true);
    try {
      await fetch(`/api/referrals/${item.referralId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status", status: "fechada" }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const impacto = item.tipo === "recebida"
    ? `Você recebeu uma referência de R$${item.valor.toLocaleString("pt-BR")}${item.segmento ? ` no segmento de ${item.segmento}` : ""}. ${item.status === "convertida" ? "Este negócio foi convertido e contribuiu para seu ONF do semestre!" : item.status === "em_andamento" || item.status === "pendente" ? "Acompanhe o andamento para maximizar a conversão." : "Esta referência não resultou em negócio fechado."}`
    : item.tipo === "dada"
      ? `Você gerou R$${item.valor.toLocaleString("pt-BR")} de valor para ${item.nome}${item.segmento ? ` no segmento de ${item.segmento}` : ""}. ${item.status === "convertida" ? "Referência bem-sucedida — este é o Givers Gain em ação!" : item.status === "em_andamento" || item.status === "pendente" ? "Acompanhe junto ao membro para garantir o fechamento." : "Esta referência não foi convertida."}`
      : item.tipo === "agradecimento_dado"
        ? `Você agradeceu a ${item.nome} por um negócio de R$${item.valor.toLocaleString("pt-BR")} fechado com sucesso. Reconhecer parceiros fortalece a cultura de Givers Gain no BNI.`
        : `${item.nome} agradeceu a você por um negócio de R$${item.valor.toLocaleString("pt-BR")} fechado com sucesso. Seu trabalho está gerando impacto real na rede!`;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="bg-surface border-b border-gray-100 sticky top-0 z-30" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="flex items-center px-4 h-14 gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => router.back()}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-background touch-manipulation -ml-1"
          >
            <ChevronLeft size={22} color="#1A1A1A" strokeWidth={2} />
          </motion.button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[17px] font-bold leading-tight truncate text-text-main font-display">{t.label}</h1>
            <p className="text-[11px] text-text-muted">{t.sublabel}</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.bg }}>
            <t.Icon size={13} color={t.color} strokeWidth={2.5} />
            <span className="text-[11px] font-bold" style={{ color: t.color }}>{t.badgeLabel}</span>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="px-4 py-4 space-y-4"
      >
        {/* Hero */}
        <div className="bg-surface rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-1.5 w-full" style={{ backgroundColor: t.color }} />
          <div className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: t.bg }}>
                <span className="text-[22px] font-extrabold font-display" style={{ color: t.color }}>
                  {item.nome.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[18px] font-extrabold text-text-main leading-tight font-display">{item.nome}</h2>
                {item.segmento && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Tag size={12} color="#8A8A8E" strokeWidth={2} />
                    <p className="text-[12px] text-text-muted">{item.segmento}</p>
                  </div>
                )}
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ backgroundColor: st.bg }}>
                  <SIcon size={11} color={st.color} strokeWidth={2.5} />
                  <span className="text-[11px] font-bold" style={{ color: st.color }}>{st.label}</span>
                </div>
              </div>
            </div>

            {is1a1 ? (
              <div className="mt-4 p-4 rounded-2xl" style={{ backgroundColor: t.bg }}>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: t.color }}>
                  Detalhes da Reunião
                </p>
                <div className="flex items-center gap-6 flex-wrap">
                  {item.local && (
                    <div className="flex items-center gap-2">
                      <MapPin size={15} color={t.color} strokeWidth={2} />
                      <span className="text-[13px] font-semibold text-text-main">{item.local}</span>
                    </div>
                  )}
                  {item.duracao && (
                    <div className="flex items-center gap-2">
                      <Timer size={15} color={t.color} strokeWidth={2} />
                      <span className="text-[13px] font-semibold" style={{ color: t.color }}>{item.duracao}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : item.valor > 0 ? (
              <div className="mt-4 p-4 rounded-2xl flex items-center justify-between" style={{ backgroundColor: t.bg }}>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: t.color }}>
                    {item.tipo === "dada" ? "Valor Gerado" : item.tipo === "recebida" ? "Valor Recebido" : "Valor do Negócio"}
                  </p>
                  <p className="text-[32px] font-extrabold leading-none font-display text-text-main">
                    R${item.valor.toLocaleString("pt-BR")}
                  </p>
                  <p className="text-[11px] text-text-muted mt-1 capitalize">{monthYear(item.dataISO)}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: t.color + "20" }}>
                  <DollarSign size={26} color={t.color} strokeWidth={1.8} />
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Informações do registro */}
        <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-50 bg-background">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Informações do Registro</p>
          </div>
          <InfoRow icon={CalendarDays} label="Data do Registro" value={longDate(item.dataISO)} />
          {is1a1 && item.local && <InfoRow icon={MapPin} label="Local" value={item.local} tint={t} />}
          {is1a1 && item.duracao && <InfoRow icon={Timer} label="Duração" value={item.duracao} tint={t} valueColor={t.color} />}
          {isRef && item.expiracaoISO && (
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: expired ? "#FFF1F1" : urgent ? "#FFFBEB" : "#F0FDF4" }}
              >
                <Clock size={16} color={expired ? "#CC0000" : urgent ? "#F59E0B" : "#22C55E"} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <p className="text-[11px] text-text-muted font-semibold">Follow-up / Expiração</p>
                <p className="text-[14px] font-bold text-text-main">{longDate(item.expiracaoISO)}</p>
                <p className="text-[11px] font-semibold mt-0.5" style={{ color: expired ? "#CC0000" : urgent ? "#F59E0B" : "#22C55E" }}>
                  {expired
                    ? `Expirou há ${Math.abs(days!)} dias`
                    : days === 0
                      ? "Vence hoje!"
                      : urgent
                        ? `Urgente: ${days} dias restantes`
                        : `${days} dias restantes`}
                </p>
              </div>
              {(expired || urgent) && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: expired ? "#FFF1F1" : "#FFFBEB" }}>
                  <AlertCircle size={16} color={expired ? "#CC0000" : "#F59E0B"} strokeWidth={2} />
                </div>
              )}
            </div>
          )}
          {origem && (
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: origem.bg }}>
                <Tag size={16} color={origem.color} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <p className="text-[11px] text-text-muted font-semibold">Canal / Origem</p>
                <p className="text-[14px] font-bold" style={{ color: origem.color }}>{origem.label}</p>
              </div>
            </div>
          )}
          {item.segmento && <InfoRow icon={Briefcase} label="Segmento de Mercado" value={item.segmento} last />}
        </div>

        {/* Motivo do agradecimento */}
        {isAgrad && item.motivoAgradecimento && (
          <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-50" style={{ backgroundColor: t.bg }}>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: t.color }}>
                Motivo do Agradecimento
              </p>
            </div>
            <div className="px-4 py-4">
              <div className="flex items-start gap-2.5">
                <HeartHandshake size={15} color={t.color} strokeWidth={2} className="flex-shrink-0 mt-0.5" />
                <p className="text-[13px] text-text-main leading-relaxed">{item.motivoAgradecimento}</p>
              </div>
            </div>
          </div>
        )}

        {/* Observações */}
        {item.observacoes && (
          <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-50 bg-background">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Observações</p>
            </div>
            <div className="px-4 py-4">
              <div className="flex items-start gap-2.5">
                <FileText size={15} color="#8A8A8E" strokeWidth={2} className="flex-shrink-0 mt-0.5" />
                <p className="text-[13px] text-text-main leading-relaxed">{item.observacoes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Impacto */}
        {(isRef || isAgrad) && (
          <div className="rounded-2xl p-4 border overflow-hidden relative" style={{ backgroundColor: t.bg, borderColor: t.color + "30" }}>
            <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full opacity-10" style={{ backgroundColor: t.color }} />
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={15} color={t.color} strokeWidth={2} />
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: t.color }}>
                {isAgrad ? "Contexto do Agradecimento" : item.tipo === "recebida" ? "Impacto Recebido" : "Impacto Gerado"}
              </p>
            </div>
            <p className="text-[13px] text-text-main leading-relaxed">{impacto}</p>
            <div className="mt-3 pt-3 border-t" style={{ borderColor: t.color + "20" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: st.color }} />
                  <span className="text-[12px] font-semibold" style={{ color: st.color }}>{st.label}</span>
                </div>
                {item.valor > 0 && (
                  <span className="text-[12px] font-extrabold font-display" style={{ color: t.color }}>
                    R${item.valor.toLocaleString("pt-BR")}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Ações rápidas */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted px-1">Ações Rápidas</p>
          <div className="grid grid-cols-2 gap-3">
            <motion.button whileTap={{ scale: 0.95 }} className="bg-surface rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center gap-2 touch-manipulation">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#F0F9FF" }}>
                <MessageCircle size={18} color="#0EA5E9" strokeWidth={2} />
              </div>
              <span className="text-[12px] font-semibold text-text-main text-center leading-tight">Enviar Mensagem</span>
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} className="bg-surface rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center gap-2 touch-manipulation">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#F0FDF4" }}>
                <Phone size={18} color="#22C55E" strokeWidth={2} />
              </div>
              <span className="text-[12px] font-semibold text-text-main text-center leading-tight">Ligar Agora</span>
            </motion.button>
          </div>

          {isRef && ["em_andamento", "pendente"].includes(item.status) && item.referralId && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={busy}
              onClick={marcarConvertida}
              className="w-full h-14 rounded-2xl flex items-center justify-center gap-2.5 touch-manipulation mt-2 disabled:opacity-60"
              style={{ backgroundColor: "#22C55E" }}
            >
              <CheckCircle2 size={20} color="white" strokeWidth={2} />
              <span className="text-white font-bold text-[15px] font-display">Marcar como Convertida</span>
            </motion.button>
          )}

          {item.referralId && (
            <Link href={`/referencias/${item.referralId}`}>
              <motion.div whileTap={{ scale: 0.97 }} className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 bg-surface border border-gray-200 touch-manipulation mt-2">
                <ExternalLink size={15} className="text-text-muted" />
                <span className="text-text-muted font-semibold text-[14px]">Abrir no CRM</span>
              </motion.div>
            </Link>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => router.back()}
            className="w-full h-12 rounded-2xl flex items-center justify-center bg-gray-100 touch-manipulation"
          >
            <span className="text-text-muted font-semibold text-[14px]">Voltar</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  tint,
  valueColor,
  last,
}: {
  icon: any;
  label: string;
  value: string;
  tint?: { color: string; bg: string };
  valueColor?: string;
  last?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${last ? "" : "border-b border-gray-50"}`}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: tint?.bg ?? "#F5F5F7" }}>
        <Icon size={16} color={tint?.color ?? "#8A8A8E"} strokeWidth={2} />
      </div>
      <div className="flex-1">
        <p className="text-[11px] text-text-muted font-semibold">{label}</p>
        <p className="text-[14px] font-bold" style={{ color: valueColor ?? "#1A1A1A" }}>{value}</p>
      </div>
    </div>
  );
}
