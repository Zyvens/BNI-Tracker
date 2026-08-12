import { getSession } from "@/lib/auth";
import { getFeedItems } from "@/lib/feed";
import { getGoals, getMemberSnapshotCached } from "@/lib/snapshot";
import { prisma } from "@/lib/prisma";
import { computeReciprocity } from "@/lib/reciprocity";
import { getThankYouDebtsForMonth, monthKeyOf } from "@/lib/thankYouDebts";
import FeedClient from "./FeedClient";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const session = (await getSession())!;
  const currentMonth = monthKeyOf(new Date());
  const [items, goals, members, snap, thankYouDebts] = await Promise.all([
    getFeedItems(session.memberId!),
    getGoals(),
    prisma.member.findMany({
      where: { active: true, id: { not: session.memberId! } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    getMemberSnapshotCached(session.memberId!),
    getThankYouDebtsForMonth(session.memberId!, currentMonth),
  ]);

  const reciprocidade = computeReciprocity(snap.refsGiven, snap.refsReceived);

  return (
    <FeedClient
      items={items}
      goal1a1={goals.reunioes1a1}
      members={members}
      reciprocidade={reciprocidade}
      thankYouMonth={currentMonth}
      thankYouDebts={thankYouDebts}
    />
  );
}
