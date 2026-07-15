import { getSession } from "@/lib/auth";
import { getMemberSnapshotCached } from "@/lib/snapshot";
import { prisma } from "@/lib/prisma";
import ReferenciasClient from "./ReferenciasClient";

export const dynamic = "force-dynamic";

export default async function ReferenciasPage() {
  const session = (await getSession())!;
  const snap = await getMemberSnapshotCached(session.memberId!);
  const members = await prisma.member.findMany({
    where: { active: true, id: { not: session.memberId! } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const mapRef = (r: (typeof snap.refsGiven)[number], direcao: "dada" | "recebida") => ({
    id: r.id,
    direcao,
    contactName: r.contactName,
    company: r.company,
    otherName:
      direcao === "dada"
        ? (r as any).receiver?.name ?? r.receiverName ?? "—"
        : (r as any).giver?.name ?? r.giverName ?? "—",
    dataISO: r.dataISO,
    estimatedValue: r.estimatedValue,
    declaredValue: r.declaredValue,
    confirmedValue: r.confirmedValue,
    status: r.status,
    confirmationStatus: r.confirmationStatus,
    origem: r.origem,
  });

  return (
    <ReferenciasClient
      recebidas={snap.refsReceived.map((r) => mapRef(r as any, "recebida"))}
      dadas={snap.refsGiven.map((r) => mapRef(r as any, "dada"))}
      members={members}
      pendencias={snap.pendencias}
    />
  );
}
