import { prisma } from "@/lib/prisma";
import MembrosClient from "./MembrosClient";

export const dynamic = "force-dynamic";

export default async function MembrosPage() {
  const members = await prisma.member.findMany({
    include: { user: { select: { username: true, mustChangePassword: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <MembrosClient
      members={members.map((m) => ({
        id: m.id,
        name: m.name,
        whatsapp: m.whatsapp,
        category: m.category,
        active: m.active,
        username: m.user?.username ?? null,
        pendingPassword: m.user?.mustChangePassword ?? false,
      }))}
    />
  );
}
