import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const b = await req.json();
  if (!b?.endpoint) return NextResponse.json({ error: "endpoint é obrigatório." }, { status: 400 });

  await prisma.pushSubscription.deleteMany({ where: { endpoint: b.endpoint, userId: session.userId } });

  return NextResponse.json({ ok: true });
}
