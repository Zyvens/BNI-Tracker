export type ReciprocityRow = {
  memberId: string;
  name: string;
  givenCount: number;
  givenClosed: number;
  receivedCount: number;
  receivedClosed: number;
  valueGenerated: number;
  valueGiven: number;
};

// Comparativo de reciprocidade: por membro com quem já houve troca de referências,
// quanto o membro deu vs. quanto recebeu (e o valor gerado em cada sentido) — pra
// deixar visível quem está "carregando" a relação. Só considera o outro lado quando
// é um membro cadastrado (referências externas não têm "conta" pra reciprocidade).
export function computeReciprocity(refsGiven: any[], refsReceived: any[]): ReciprocityRow[] {
  const map = new Map<string, ReciprocityRow>();
  const getRow = (memberId: string, name: string) => {
    let row = map.get(memberId);
    if (!row) {
      row = { memberId, name, givenCount: 0, givenClosed: 0, receivedCount: 0, receivedClosed: 0, valueGenerated: 0, valueGiven: 0 };
      map.set(memberId, row);
    }
    return row;
  };
  for (const r of refsGiven) {
    if (!r.receiverId) continue;
    const row = getRow(r.receiverId, r.receiver?.name ?? r.receiverName ?? "—");
    row.givenCount++;
    if (r.status === "fechada") {
      row.givenClosed++;
      row.valueGiven += r.confirmedValue ?? r.declaredValue ?? r.estimatedValue;
    }
  }
  for (const r of refsReceived) {
    if (!r.giverId) continue;
    const row = getRow(r.giverId, r.giver?.name ?? r.giverName ?? "—");
    row.receivedCount++;
    if (r.status === "fechada") {
      row.receivedClosed++;
      row.valueGenerated += r.confirmedValue ?? r.declaredValue ?? r.estimatedValue;
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => Math.abs(b.givenCount - b.receivedCount) - Math.abs(a.givenCount - a.receivedCount)
  );
}
