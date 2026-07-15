import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NotificacoesClient from "./NotificacoesClient";

export const dynamic = "force-dynamic";

export default async function NotificacoesPage() {
  const session = (await getSession())!;
  const notifications = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <NotificacoesClient
      notifications={notifications.map((n) => ({
        id: n.id,
        tipo: n.tipo,
        title: n.title,
        body: n.body,
        link: n.link,
        read: !!n.readAt,
        createdAt: n.createdAt.toISOString(),
      }))}
    />
  );
}
