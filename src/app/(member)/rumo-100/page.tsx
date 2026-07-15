import { getSession } from "@/lib/auth";
import { getMemberSnapshotCached } from "@/lib/snapshot";
import Rumo100Client from "./Rumo100Client";

export const dynamic = "force-dynamic";

export default async function Rumo100Page() {
  const session = (await getSession())!;
  const snap = await getMemberSnapshotCached(session.memberId!);

  return (
    <Rumo100Client
      score={snap.score}
      targetScore={snap.goals.targetScore}
      safetyMargin={snap.goals.safetyMargin}
      windowLabel={snap.window.label}
      statusCard={snap.statusCard}
      ausencias={snap.ausencias}
      atrasos={snap.atrasos}
      actions={snap.actions.map((a) => ({
        id: a.kpi.id,
        label: a.kpi.label,
        isCurrency: !!a.kpi.isCurrency,
        goal: a.kpi.goal,
        currentValue: a.currentValue,
        urgency: a.urgency,
        actionMessage: a.actionMessage,
        safeUntilLabel: a.safeUntilLabel,
        dropMonthLabel: a.dropMonthLabel,
        daysUntilDrop: a.daysUntilDrop,
        neededToRecover: a.neededToRecover,
        safetyExtra: a.safetyExtra,
      }))}
    />
  );
}
