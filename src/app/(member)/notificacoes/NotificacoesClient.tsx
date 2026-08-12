"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, AlertTriangle, BadgeDollarSign, Info } from "lucide-react";
import { PageHeader, fadeUp, stagger } from "@/components/ui";

type Notif = {
  id: string;
  tipo: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
};

const TIPO_STYLE: Record<string, { icon: any; color: string; bg: string }> = {
  critico: { icon: AlertTriangle, color: "#CC0000", bg: "var(--tint-red-bg)" },
  alerta: { icon: AlertTriangle, color: "#D97706", bg: "var(--tint-amber-bg)" },
  confirmacao: { icon: BadgeDollarSign, color: "#2563EB", bg: "var(--tint-blue-bg)" },
  info: { icon: Info, color: "#6B7280", bg: "var(--color-track-soft)" },
};

export default function NotificacoesClient({ notifications }: { notifications: Notif[] }) {
  const router = useRouter();

  // Marca tudo como lido ao abrir a central
  useEffect(() => {
    if (notifications.some((n) => !n.read)) {
      fetch("/api/notifications", { method: "PATCH" }).then(() => router.refresh());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Notificações"
        subtitle="Alertas e insights do seu desempenho"
        right={
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-background flex items-center justify-center touch-manipulation">
            <ArrowLeft size={16} className="text-text-main" strokeWidth={2.5} />
          </button>
        }
      />

      <motion.div initial="hidden" animate="visible" variants={stagger} className="px-4 py-4 space-y-2.5">
        {notifications.length === 0 && (
          <motion.div variants={fadeUp} className="bg-surface rounded-2xl border border-gray-100 p-8 flex flex-col items-center text-center">
            <Bell size={32} className="text-gray-300 mb-2" />
            <p className="text-[14px] font-bold text-text-main font-display">Nenhuma notificação</p>
            <p className="text-[11px] text-text-muted mt-1">Os alertas do seu plano de ação aparecerão aqui.</p>
          </motion.div>
        )}

        {notifications.map((n) => {
          const st = TIPO_STYLE[n.tipo] ?? TIPO_STYLE.info;
          const Icon = st.icon;
          const inner = (
            <motion.div
              variants={fadeUp}
              className="bg-surface rounded-2xl shadow-sm border p-4 flex gap-3"
              style={{ borderColor: n.read ? "var(--color-border)" : st.color + "44" }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: st.bg }}>
                <Icon size={16} color={st.color} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] leading-snug ${n.read ? "font-semibold text-text-muted" : "font-extrabold text-text-main"}`}>
                  {n.title}
                </p>
                {n.body && <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">{n.body}</p>}
                <p className="text-[10px] text-text-muted mt-1">
                  {new Date(n.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              {!n.read && <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: st.color }} />}
            </motion.div>
          );
          return n.link ? (
            <Link key={n.id} href={n.link}>{inner}</Link>
          ) : (
            <div key={n.id}>{inner}</div>
          );
        })}
      </motion.div>
    </div>
  );
}
