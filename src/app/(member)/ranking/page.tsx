import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMemberSnapshotCached } from "@/lib/snapshot";
import RankingClient from "./RankingClient";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const session = (await getSession())!;

  const members = await prisma.member.findMany({
    where: { active: true, showInRanking: true },
    select: { id: true, name: true },
  });

  const rows = await Promise.all(
    members.map(async (m) => {
      const snap = await getMemberSnapshotCached(m.id);
      return { id: m.id, name: m.name, score: snap.score, targetScore: snap.goals.targetScore };
    })
  );

  rows.sort((a, b) => b.score - a.score);

  return (
    <RankingClient
      rows={rows}
      meId={session.memberId!}
      optedIn={members.some((m) => m.id === session.memberId)}
    />
  );
}
