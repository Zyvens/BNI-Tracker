import { prisma } from "@/lib/prisma";

// Item do Feed de Atividades — espelha o modelo do app de referência.
export type FeedItem = {
  id: string; // ref_<id> | o2o_<id> | agd_<id> | agr_<id>
  tipo: "dada" | "recebida" | "reuniao_1a1" | "agradecimento_dado" | "agradecimento_recebido";
  nome: string;
  valor: number;
  dataISO: string;
  dataLabel: string;
  segmento: string | null;
  origem: string | null; // direto | clube_permuta | parceria
  status: "convertida" | "em_andamento" | "perdida" | "pendente" | "realizado";
  local: string | null;
  duracao: string | null;
  motivoAgradecimento: string | null;
  observacoes: string | null;
  expiracaoISO: string | null;
  referralId: string | null; // vínculo com o CRM
};

function dataLabel(iso: string): string {
  return new Date(iso + "T00:00:00")
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    .replace(".", "");
}

function mapOrigem(origem: string): string {
  switch (origem) {
    case "clube_permuta": return "clube_permuta";
    case "parceria_estrategica": return "parceria";
    default: return "direto";
  }
}

function mapRefStatus(status: string): FeedItem["status"] {
  if (status === "fechada") return "convertida";
  if (["perdida", "sem_perfil", "duplicada"].includes(status)) return "perdida";
  if (["recebida", "enviada", "contato_pendente"].includes(status)) return "pendente";
  return "em_andamento";
}

const money = (v: number) => `R$ ${v.toLocaleString("pt-BR")}`;

export async function getFeedItems(memberId: string): Promise<FeedItem[]> {
  const [refsGiven, refsReceived, oneToOnes] = await Promise.all([
    prisma.referral.findMany({ where: { giverId: memberId }, include: { receiver: true } }),
    prisma.referral.findMany({ where: { receiverId: memberId }, include: { giver: true } }),
    prisma.oneToOne.findMany({ where: { memberId }, include: { with: true } }),
  ]);

  const items: FeedItem[] = [];

  for (const r of refsGiven) {
    const valor = r.confirmedValue ?? r.declaredValue ?? r.estimatedValue;
    items.push({
      id: `ref_${r.id}`,
      tipo: "dada",
      nome: r.receiver?.name ?? r.receiverName ?? r.contactName,
      valor,
      dataISO: r.dataISO,
      dataLabel: dataLabel(r.dataISO),
      segmento: r.segment ?? r.category,
      origem: mapOrigem(r.origem),
      status: mapRefStatus(r.status),
      local: null,
      duracao: null,
      motivoAgradecimento: null,
      observacoes: r.notes,
      expiracaoISO: r.nextActionISO,
      referralId: r.id,
    });
    // Agradecimento recebido: o beneficiado declarou valor da sua referência
    if (r.declaredValue != null && r.declaredISO) {
      items.push({
        id: `agr_${r.id}`,
        tipo: "agradecimento_recebido",
        nome: r.receiver?.name ?? r.receiverName ?? "Membro",
        valor: r.confirmedValue ?? r.declaredValue,
        dataISO: r.declaredISO,
        dataLabel: dataLabel(r.declaredISO),
        segmento: r.segment ?? r.category,
        origem: null,
        status: r.confirmationStatus === "confirmada" ? "realizado" : "pendente",
        local: null,
        duracao: null,
        motivoAgradecimento: `${r.receiver?.name ?? "O beneficiado"} agradeceu pela referência de ${r.contactName} que resultou em negócio de ${money(r.declaredValue)}.`,
        observacoes: null,
        expiracaoISO: null,
        referralId: r.id,
      });
    }
  }

  for (const r of refsReceived) {
    const valor = r.confirmedValue ?? r.declaredValue ?? r.estimatedValue;
    items.push({
      id: `rec_${r.id}`,
      tipo: "recebida",
      nome: r.giver?.name ?? r.giverName ?? r.contactName,
      valor,
      dataISO: r.dataISO,
      dataLabel: dataLabel(r.dataISO),
      segmento: r.segment ?? r.category,
      origem: mapOrigem(r.origem),
      status: mapRefStatus(r.status),
      local: null,
      duracao: null,
      motivoAgradecimento: null,
      observacoes: r.notes,
      expiracaoISO: r.nextActionISO,
      referralId: r.id,
    });
    // Agradecimento dado: você declarou o valor recebido
    if (r.declaredValue != null && r.declaredISO) {
      items.push({
        id: `agd_${r.id}`,
        tipo: "agradecimento_dado",
        nome: r.giver?.name ?? r.giverName ?? "Membro",
        valor: r.confirmedValue ?? r.declaredValue,
        dataISO: r.declaredISO,
        dataLabel: dataLabel(r.declaredISO),
        segmento: r.segment ?? r.category,
        origem: null,
        status: r.confirmationStatus === "confirmada" ? "realizado" : "pendente",
        local: null,
        duracao: null,
        motivoAgradecimento: `Você agradeceu a ${r.giver?.name ?? r.giverName ?? "quem indicou"} pelo negócio de ${money(r.declaredValue)} fechado com ${r.contactName}.`,
        observacoes: null,
        expiracaoISO: null,
        referralId: r.id,
      });
    }
  }

  for (const o of oneToOnes) {
    items.push({
      id: `o2o_${o.id}`,
      tipo: "reuniao_1a1",
      nome: o.with?.name ?? o.withName ?? "Membro",
      valor: 0,
      dataISO: o.dataISO,
      dataLabel: dataLabel(o.dataISO),
      segmento: null,
      origem: null,
      status: "realizado",
      local: o.local,
      duracao: o.duracao,
      motivoAgradecimento: null,
      observacoes: o.notes,
      expiracaoISO: null,
      referralId: null,
    });
  }

  return items.sort((a, b) => b.dataISO.localeCompare(a.dataISO));
}

export async function getFeedItem(memberId: string, id: string): Promise<FeedItem | null> {
  const items = await getFeedItems(memberId);
  return items.find((i) => i.id === id) ?? null;
}
