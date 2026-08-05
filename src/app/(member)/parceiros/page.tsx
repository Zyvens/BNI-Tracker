import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ParceirosClient from "./ParceirosClient";

export const dynamic = "force-dynamic";

export default async function ParceirosPage() {
  const session = (await getSession())!;

  const [partners, refs] = await Promise.all([
    prisma.recurringPartner.findMany({
      where: { memberId: session.memberId! },
      orderBy: { createdAt: "desc" },
    }),
    prisma.referral.findMany({
      where: { receiverId: session.memberId!, giverId: null, giverName: { not: null } },
      select: { giverName: true, status: true, estimatedValue: true, declaredValue: true, confirmedValue: true },
    }),
  ]);

  const byName = new Map<string, { count: number; fechadas: number; valor: number }>();
  for (const r of refs) {
    const key = (r.giverName ?? "").trim().toLowerCase();
    if (!key) continue;
    const agg = byName.get(key) ?? { count: 0, fechadas: 0, valor: 0 };
    agg.count++;
    if (r.status === "fechada") {
      agg.fechadas++;
      agg.valor += r.confirmedValue ?? r.declaredValue ?? r.estimatedValue;
    }
    byName.set(key, agg);
  }

  return (
    <ParceirosClient
      partners={partners.map((p) => ({
        id: p.id,
        name: p.name,
        company: p.company,
        phone: p.phone,
        notes: p.notes,
        active: p.active,
        lastThankedAt: p.lastThankedAt ? p.lastThankedAt.toISOString() : null,
        stats: byName.get(p.name.trim().toLowerCase()) ?? { count: 0, fechadas: 0, valor: 0 },
      }))}
    />
  );
}
