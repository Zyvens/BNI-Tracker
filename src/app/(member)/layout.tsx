import { redirect } from "next/navigation";
import Link from "next/link";
import { Settings } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getMemberSnapshotCached } from "@/lib/snapshot";
import { generateNotifications } from "@/lib/notifications";
import BottomNav from "@/components/BottomNav";
import VoiceNoteFab from "@/components/VoiceNoteFab";

export const dynamic = "force-dynamic";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.memberId) redirect(session.role === "ADMIN" ? "/admin" : "/login");

  const snap = await getMemberSnapshotCached(session.memberId);

  // Gera alertas inteligentes a cada visita (idempotente por dedupeKey)
  await generateNotifications(session.userId, snap).catch(() => {});

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      <div className="flex-1 pb-28">{children}</div>
      <VoiceNoteFab />
      <Link
        href="/configuracoes"
        aria-label="Configurações"
        className="fixed z-40 flex items-center justify-center w-12 h-12 rounded-full touch-manipulation bg-surface border border-gray-100"
        style={{
          left: "16px",
          bottom: "calc(env(safe-area-inset-bottom) + 72px)",
          boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
        }}
      >
        <Settings size={18} color="var(--color-text-main)" strokeWidth={2} />
      </Link>
      <BottomNav score={snap.score} max={snap.goals.targetScore} />
    </div>
  );
}
