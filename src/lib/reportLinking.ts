import { prisma } from "@/lib/prisma";

// Vincula retroativamente relatórios já importados (por nome) a um membro recém-criado
// ou renomeado — sem isso, quem se cadastra depois do PDF ser importado nunca aparece
// vinculado (o import original só casa nomes com os membros que já existiam naquele momento).
export async function linkPastReports(memberId: string, name: string): Promise<number> {
  const result = await prisma.performanceRecord.updateMany({
    where: {
      memberId: null,
      memberName: { equals: name.trim(), mode: "insensitive" },
    },
    data: { memberId },
  });
  return result.count;
}
