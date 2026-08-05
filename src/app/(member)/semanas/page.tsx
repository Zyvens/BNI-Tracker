import { getSession } from "@/lib/auth";
import { getMemberSnapshotCached } from "@/lib/snapshot";
import { prisma } from "@/lib/prisma";
import SemanasClient from "./SemanasClient";

export const dynamic = "force-dynamic";

function dataLabel(iso: string): string {
  return new Date(iso + "T00:00:00")
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    .replace(".", "");
}

// Segunda-feira da semana de referência (início da semana ISO)
function weekStartISO(d: Date): string {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}

export default async function SemanasPage() {
  const session = (await getSession())!;
  const snap = await getMemberSnapshotCached(session.memberId!);
  const weeklyUpdates = await prisma.weeklyUpdate.findMany({
    where: { memberId: session.memberId! },
    orderBy: { weekISO: "desc" },
  });
  const currentWeekISO = weekStartISO(new Date());

  return (
    <SemanasClient
      currentWeekISO={currentWeekISO}
      weeklyUpdates={weeklyUpdates.map((w) => ({
        weekISO: w.weekISO,
        text: w.text,
        updatedAt: w.updatedAt.toISOString(),
      }))}
      windowLabel={snap.window.label}
      totals={{
        reunioes1a1: snap.current.reunioes1a1,
        convidados: snap.current.convidados,
        uegs: snap.current.uegs,
        onf: snap.current.opnf,
        presencas: snap.presencas,
        ausencias: snap.ausencias,
        substituicoes: snap.substituicoes,
        total: snap.totalReunioes,
      }}
      entries={snap.entries
        .slice()
        .reverse()
        .map((e) => ({
          id: e.id,
          dateISO: e.dateISO,
          dataLabel: dataLabel(e.dateISO),
          presenca: e.presenca,
          atrasado: e.atrasado,
          ueg: e.ueg,
          testemunho: e.testemunho,
          refs: e.rdi + e.rde,
          convidados: e.convidados,
          reunioes1a1: e.reunioes1a1,
          onf: e.onf,
          observacoes: e.observacoes,
        }))}
    />
  );
}
