import { getSession } from "@/lib/auth";
import { getMemberSnapshotCached } from "@/lib/snapshot";
import SaudeDmiClient from "./SaudeDmiClient";

export const dynamic = "force-dynamic";

export default async function SaudeDmiPage() {
  const session = (await getSession())!;
  const snap = await getMemberSnapshotCached(session.memberId!);

  const greens = snap.kpis.filter((k) => k.status === "green").length;
  const yellows = snap.kpis.filter((k) => k.status === "yellow").length;
  const reds = snap.kpis.filter((k) => k.status === "red").length;

  return (
    <SaudeDmiClient
      windowLabel={snap.window.label}
      windowStart={snap.window.start}
      windowEnd={snap.window.end}
      greens={greens}
      yellows={yellows}
      reds={reds}
      kpis={snap.kpis.map((k) => ({
        id: k.id,
        label: k.label,
        metaLabel: k.metaLabel,
        goal: k.goal,
        current: k.current,
        status: k.status,
        pct: k.pct,
        dica: k.dica,
        isCurrency: !!k.isCurrency,
      }))}
    />
  );
}
