import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ConvidadosClient from "./ConvidadosClient";

export const dynamic = "force-dynamic";

export default async function ConvidadosPage() {
  const session = (await getSession())!;
  const guests = await prisma.guest.findMany({
    where: { memberId: session.memberId! },
    orderBy: { inviteISO: "desc" },
  });

  return (
    <ConvidadosClient
      guests={guests.map((g) => ({
        id: g.id,
        name: g.name,
        company: g.company,
        category: g.category,
        phone: g.phone,
        inviteISO: g.inviteISO,
        meetingISO: g.meetingISO,
        confirmed: g.confirmed,
        attended: g.attended,
        interested: g.interested,
        becameMember: g.becameMember,
        notes: g.notes,
      }))}
    />
  );
}
