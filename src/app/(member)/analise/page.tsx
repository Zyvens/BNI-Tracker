import { getSession } from "@/lib/auth";
import { getMemberSnapshotCached, daysSince } from "@/lib/snapshot";
import { prisma } from "@/lib/prisma";
import AnaliseClient from "./AnaliseClient";

export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = ["fechada"];
const DEAD = ["perdida", "sem_perfil", "duplicada"];

export default async function AnalisePage() {
  const session = (await getSession())!;
  const snap = await getMemberSnapshotCached(session.memberId!);

  // ---- Funil de conversão (referências recebidas) ----
  const rec = snap.refsReceived;
  const contatadas = rec.filter((r) => !["recebida", "contato_pendente"].includes(r.status)).length;
  const reunioes = rec.filter((r) =>
    ["reuniao_marcada", "diagnostico", "proposta_enviada", "negociacao", "fechada"].includes(r.status)
  ).length;
  const propostas = rec.filter((r) => ["proposta_enviada", "negociacao", "fechada"].includes(r.status)).length;
  const fechadas = rec.filter((r) => r.status === "fechada").length;
  const perdidas = rec.filter((r) => r.status === "perdida").length;
  const valorFechado = rec
    .filter((r) => r.status === "fechada")
    .reduce((s, r) => s + (r.confirmedValue ?? r.declaredValue ?? 0), 0);
  const ticketMedio = fechadas > 0 ? valorFechado / fechadas : 0;

  const temposContato = rec
    .filter((r) => r.firstContactISO)
    .map((r) => daysSince(r.dataISO, new Date(r.firstContactISO + "T00:00:00")));
  const tempoMedioContato =
    temposContato.length > 0 ? Math.round(temposContato.reduce((a, b) => a + b, 0) / temposContato.length) : null;

  // ---- Relacionamentos (ficha e ranking) ----
  type Rel = {
    id: string;
    name: string;
    recebidasDele: number;
    dadasParaEle: number;
    valorRecebido: number;
    valorGerado: number;
    oneToOnes: number;
    ultimaInteracaoISO: string | null;
  };
  const rels = new Map<string, Rel>();
  const getRel = (id: string, name: string): Rel => {
    if (!rels.has(id)) {
      rels.set(id, { id, name, recebidasDele: 0, dadasParaEle: 0, valorRecebido: 0, valorGerado: 0, oneToOnes: 0, ultimaInteracaoISO: null });
    }
    return rels.get(id)!;
  };
  const touch = (rel: Rel, iso: string) => {
    if (!rel.ultimaInteracaoISO || iso > rel.ultimaInteracaoISO) rel.ultimaInteracaoISO = iso;
  };

  for (const r of rec) {
    const g = (r as any).giver;
    if (!g) continue;
    const rel = getRel(g.id, g.name);
    rel.recebidasDele++;
    if (r.status === "fechada") rel.valorRecebido += r.confirmedValue ?? r.declaredValue ?? 0;
    touch(rel, r.dataISO);
  }
  for (const r of snap.refsGiven) {
    const rc = (r as any).receiver;
    if (!rc) continue;
    const rel = getRel(rc.id, rc.name);
    rel.dadasParaEle++;
    if (r.status === "fechada") rel.valorGerado += r.confirmedValue ?? r.declaredValue ?? 0;
    touch(rel, r.dataISO);
  }
  for (const o of snap.oneToOnes) {
    const w = (o as any).with;
    if (!w) continue;
    const rel = getRel(w.id, w.name);
    rel.oneToOnes++;
    touch(rel, o.dataISO);
  }

  const relacionamentos = Array.from(rels.values()).sort(
    (a, b) => b.valorRecebido + b.valorGerado - (a.valorRecebido + a.valorGerado)
  );

  // ---- Evolução da pontuação oficial ----
  const records = await prisma.performanceRecord.findMany({
    where: { memberId: session.memberId! },
    include: { report: true },
    orderBy: [{ report: { year: "asc" } }, { report: { month: "asc" } }],
  });
  const evolucao = records.map((r) => ({
    label: `${String(r.report.month).padStart(2, "0")}/${r.report.year}`,
    pontos: r.totalPoints,
  }));

  // ---- Insights automáticos ----
  const insights: string[] = [];
  const proj = snap.months[snap.months.length - 1];
  if (proj) {
    insights.push(
      proj.score >= snap.goals.targetScore
        ? `Mantendo o ritmo atual, você encerrará o período com ${proj.score} pontos. Excelente!`
        : `Mantendo o ritmo atual, você encerrará o período com ${proj.score} pontos — abaixo da meta de ${snap.goals.targetScore}.`
    );
  }
  const expiring = snap.actions.filter((a) => a.daysUntilDrop !== null && a.daysUntilDrop <= 30 && !a.isAlreadyBelow);
  if (expiring.length > 0) {
    insights.push(`${expiring.length} indicador(es) perderão pontos por caducidade nos próximos 30 dias.`);
  }
  if (tempoMedioContato !== null && tempoMedioContato > 5) {
    insights.push(`Seu tempo médio para o primeiro contato é de ${tempoMedioContato} dias. Tente responder em até 48h.`);
  }
  const semDeclaracao = snap.refsGiven.filter(
    (r) => r.status === "fechada" && !["confirmada"].includes(r.confirmationStatus) && r.declaredValue == null
  ).length;
  if (semDeclaracao > 0) {
    insights.push(`Existem ${semDeclaracao} referência(s) dada(s) fechada(s) sem declaração de valor pelo beneficiado.`);
  }
  const melhorParceiro = relacionamentos[0];
  if (melhorParceiro && melhorParceiro.valorRecebido > 0) {
    insights.push(`Quem mais gera valor para você: ${melhorParceiro.name}.`);
  }
  const inativos = relacionamentos.filter((r) => r.ultimaInteracaoISO && daysSince(r.ultimaInteracaoISO) > 60);
  if (inativos.length > 0) {
    insights.push(`${inativos.length} relacionamento(s) sem movimentação há mais de 60 dias — agende um 1-a-1.`);
  }

  return (
    <AnaliseClient
      windowLabel={snap.window.label}
      funil={{
        recebidas: rec.length,
        contatadas,
        reunioes,
        propostas,
        fechadas,
        perdidas,
        taxaContato: rec.length > 0 ? Math.round((contatadas / rec.length) * 100) : 0,
        taxaConversao: rec.length > 0 ? Math.round((fechadas / rec.length) * 100) : 0,
        valorFechado,
        ticketMedio,
        tempoMedioContato,
      }}
      relacionamentos={relacionamentos.slice(0, 10).map((r) => ({
        ...r,
        reciprocidade:
          r.dadasParaEle > 0 ? Math.round((r.recebidasDele / r.dadasParaEle) * 100) / 100 : null,
        diasSemInteracao: r.ultimaInteracaoISO ? daysSince(r.ultimaInteracaoISO) : null,
      }))}
      evolucao={evolucao}
      insights={insights}
    />
  );
}
