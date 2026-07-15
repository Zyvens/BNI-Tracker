import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: "Informe usuário e senha." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { username: String(username).toLowerCase().trim() },
    include: { member: true },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: "Usuário ou senha incorretos." }, { status: 401 });
  }

  if (user.member && !user.member.active) {
    return NextResponse.json({ error: "Acesso desativado. Fale com o coordenador." }, { status: 403 });
  }

  await createSession({
    userId: user.id,
    role: user.role as "ADMIN" | "MEMBER",
    memberId: user.memberId,
    name: user.member?.name ?? "Coordenador",
  });

  return NextResponse.json({
    ok: true,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  });
}
