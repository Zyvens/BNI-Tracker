import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberSnapshot } from "@/lib/snapshot";
import { generateNotifications } from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Disparo proativo diário (Vercel Cron, ver vercel.json): roda o mesmo motor
// de alertas que já executa a cada visita ao app, mas para todos os membros
// de uma vez — garante push mesmo em dias que o membro não abre o app.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { memberId: { not: null } },
    select: { id: true, memberId: true },
  });

  let processed = 0;
  for (const u of users) {
    try {
      const snap = await getMemberSnapshot(u.memberId!);
      await generateNotifications(u.id, snap);
      processed++;
    } catch {
      // segue para o próximo membro mesmo se um snapshot falhar
    }
  }

  return NextResponse.json({ ok: true, processed, total: users.length });
}
