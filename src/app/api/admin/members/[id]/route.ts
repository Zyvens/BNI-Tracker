import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { name, email, whatsapp, company, category, active, newPassword } = body;

  const member = await prisma.member.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(whatsapp !== undefined ? { whatsapp } : {}),
      ...(company !== undefined ? { company } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(active !== undefined ? { active } : {}),
    },
    include: { user: true },
  });

  if (newPassword && member.user) {
    await prisma.user.update({
      where: { id: member.user.id },
      data: { passwordHash: await bcrypt.hash(String(newPassword), 10), mustChangePassword: true },
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await prisma.user.findUnique({ where: { memberId: params.id } });
  if (user) await prisma.user.delete({ where: { id: user.id } });
  await prisma.member.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
