import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { name, email, whatsapp, company, category, active } = body;

  if (name !== undefined && !String(name).trim()) {
    return NextResponse.json({ error: "O nome não pode ficar vazio." }, { status: 400 });
  }

  await prisma.member.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined ? { name: String(name).trim() } : {}),
      ...(email !== undefined ? { email: email || null } : {}),
      ...(whatsapp !== undefined ? { whatsapp: whatsapp || null } : {}),
      ...(company !== undefined ? { company: company || null } : {}),
      ...(category !== undefined ? { category: category || null } : {}),
      ...(active !== undefined ? { active: !!active } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await prisma.user.findUnique({ where: { memberId: params.id } });
  if (user) await prisma.user.delete({ where: { id: user.id } });
  await prisma.member.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
