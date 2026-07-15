import { prisma } from "@/lib/prisma";
import ConfigClient from "./ConfigClient";

export const dynamic = "force-dynamic";

export default async function ConfigPage() {
  let s = await prisma.settings.findFirst();
  if (!s) s = await prisma.settings.create({ data: { id: 1 } });

  return (
    <ConfigClient
      settings={{
        groupName: s.groupName,
        goalRefs: s.goalRefs,
        goalConvidados: s.goalConvidados,
        goal1a1: s.goal1a1,
        goalUegs: s.goalUegs,
        goalTestemunhos: s.goalTestemunhos,
        goalOpnf: s.goalOpnf,
        targetScore: s.targetScore,
        safetyMargin: s.safetyMargin,
      }}
    />
  );
}
