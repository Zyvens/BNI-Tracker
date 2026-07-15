import { prisma } from "@/lib/prisma";
import RelatoriosClient from "./RelatoriosClient";

export const dynamic = "force-dynamic";

export default async function RelatoriosPage() {
  const reports = await prisma.report.findMany({
    include: { _count: { select: { performanceRecords: true } } },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  return (
    <RelatoriosClient
      reports={reports.map((r) => ({
        id: r.id,
        month: r.month,
        year: r.year,
        count: r._count.performanceRecords,
        importedAt: r.importedAt.toISOString(),
      }))}
    />
  );
}
