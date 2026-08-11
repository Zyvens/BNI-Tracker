import { prisma } from "@/lib/prisma";

export function monthKeyOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export type ThankYouDebtRow = {
  id: string;
  name: string;
  monthlyValue: number;
  thanked: boolean;
};

// Débitos de agradecimento ativos naquele mês (só entra quem já existia até lá —
// não faz sentido cobrar agradecimento de um mês anterior à pessoa ter sido cadastrada).
export async function getThankYouDebtsForMonth(memberId: string, monthKey: string): Promise<ThankYouDebtRow[]> {
  const debts = await prisma.thankYouDebt.findMany({
    where: { memberId, active: true },
    orderBy: { createdAt: "asc" },
    include: { months: { where: { monthKey } } },
  });
  return debts
    .filter((d) => monthKeyOf(d.createdAt) <= monthKey)
    .map((d) => ({
      id: d.id,
      name: d.name,
      monthlyValue: d.monthlyValue,
      thanked: d.months[0]?.thanked ?? false,
    }));
}
