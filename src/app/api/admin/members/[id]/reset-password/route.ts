import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generatePassword } from "@/lib/credentials";

// Gera uma nova senha aleatória para o membro e retorna o valor em texto puro
// (única vez que fica visível — não é salvo em lugar nenhum além do hash).
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const member = await prisma.member.findUnique({ where: { id: params.id }, include: { user: true } });
  if (!member?.user) {
    return NextResponse.json({ error: "Este membro não possui login." }, { status: 404 });
  }

  const password = generatePassword();
  await prisma.user.update({
    where: { id: member.user.id },
    data: { passwordHash: await bcrypt.hash(password, 10), mustChangePassword: true },
  });

  return NextResponse.json({ username: member.user.username, password });
}
