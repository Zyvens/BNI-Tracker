import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const members = await prisma.member.findMany({
    include: { user: { select: { username: true, mustChangePassword: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(members);
}

// Cria membro + login
export async function POST(req: NextRequest) {
  const { name, email, whatsapp, company, category, username, password } = await req.json();
  if (!name || !username || !password) {
    return NextResponse.json({ error: "Nome, usuário e senha são obrigatórios." }, { status: 400 });
  }

  const uname = String(username).toLowerCase().trim();
  const exists = await prisma.user.findUnique({ where: { username: uname } });
  if (exists) return NextResponse.json({ error: "Este usuário já existe." }, { status: 409 });

  const member = await prisma.member.create({
    data: {
      name: String(name).trim(),
      email: email || null,
      whatsapp: whatsapp || null,
      company: company || null,
      category: category || null,
      user: {
        create: {
          username: uname,
          passwordHash: await bcrypt.hash(String(password), 10),
          role: "MEMBER",
          mustChangePassword: true,
        },
      },
    },
    include: { user: { select: { username: true } } },
  });

  return NextResponse.json(member, { status: 201 });
}
