import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PossibilidadesClient from "./PossibilidadesClient";

export const dynamic = "force-dynamic";

export default async function PossibilidadesPage() {
  const session = (await getSession())!;
  const possibilities = await prisma.possibility.findMany({
    where: { memberId: session.memberId! },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <PossibilidadesClient
      possibilities={possibilities.map((p) => ({
        id: p.id,
        contactName: p.contactName,
        company: p.company,
        notes: p.notes,
        status: p.status,
        updatedAt: p.updatedAt.toISOString(),
      }))}
    />
  );
}
