import { redirect } from "next/navigation";
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
      <BottomNav score={snap.score} max={snap.goals.targetScore} />
    </div>
  );
}
