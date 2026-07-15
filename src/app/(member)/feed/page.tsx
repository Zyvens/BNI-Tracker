import { getSession } from "@/lib/auth";
import { getFeedItems } from "@/lib/feed";
import { getGoals } from "@/lib/snapshot";
import { prisma } from "@/lib/prisma";
import FeedClient from "./FeedClient";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const session = (await getSession())!;
  const [items, goals, members] = await Promise.all([
    getFeedItems(session.memberId!),
    getGoals(),
    prisma.member.findMany({
      where: { active: true, id: { not: session.memberId! } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return <FeedClient items={items} goal1a1={goals.reunioes1a1} members={members} />;
}
