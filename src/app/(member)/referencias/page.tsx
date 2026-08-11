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
    otherId: direcao === "dada" ? r.receiverId : r.giverId,
    dataISO: r.dataISO,
    estimatedValue: r.estimatedValue,
    declaredValue: r.declaredValue,
    confirmedValue: r.confirmedValue,
    status: r.status,
    confirmationStatus: r.confirmationStatus,
    origem: r.origem,
    dealType: (r as any).dealType ?? null,
  });

  // Comparativo de reciprocidade: por membro com quem já houve troca de referências,
  // quanto você deu vs. quanto recebeu (e o valor gerado pelo que recebeu e fechou) —
  // pra deixar visível quem está "carregando" a relação em cada sentido. Só considera
  // o outro lado quando é um membro cadastrado (referências externas não têm "conta"
  // pra reciprocidade).
  type ReciprocityRow = {
    memberId: string;
    name: string;
    givenCount: number;
    givenClosed: number;
    receivedCount: number;
    receivedClosed: number;
    valueGenerated: number;
  };
  const reciMap = new Map<string, ReciprocityRow>();
  const getRow = (memberId: string, name: string) => {
    let row = reciMap.get(memberId);
    if (!row) {
      row = { memberId, name, givenCount: 0, givenClosed: 0, receivedCount: 0, receivedClosed: 0, valueGenerated: 0 };
      reciMap.set(memberId, row);
    }
    return row;
  };
  for (const r of snap.refsGiven) {
    if (!r.receiverId) continue;
    const row = getRow(r.receiverId, (r as any).receiver?.name ?? r.receiverName ?? "—");
    row.givenCount++;
    if (r.status === "fechada") row.givenClosed++;
  }
  for (const r of snap.refsReceived) {
    if (!r.giverId) continue;
    const row = getRow(r.giverId, (r as any).giver?.name ?? r.giverName ?? "—");
    row.receivedCount++;
    if (r.status === "fechada") {
      row.receivedClosed++;
      row.valueGenerated += r.confirmedValue ?? r.declaredValue ?? r.estimatedValue;
    }
  }
  const reciprocidade = Array.from(reciMap.values()).sort(
    (a, b) => Math.abs(b.givenCount - b.receivedCount) - Math.abs(a.givenCount - a.receivedCount)
  );

  return (
    <ReferenciasClient
      recebidas={snap.refsReceived.map((r) => mapRef(r as any, "recebida"))}
      dadas={snap.refsGiven.map((r) => mapRef(r as any, "dada"))}
      members={members}
      pendencias={snap.pendencias}
      reciprocidade={reciprocidade}
    />
  );
}
