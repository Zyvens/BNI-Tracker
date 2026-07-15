import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { slugifyUsername, generatePassword, generateUniqueUsername } from "@/lib/credentials";
import { linkPastReports } from "@/lib/reportLinking";

export async function GET() {
  const members = await prisma.member.findMany({
    include: { user: { select: { username: true, mustChangePassword: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(members);
}

// Cria membro + login. Usuário e senha são gerados automaticamente a partir do nome;
// o coordenador só informa nome, categoria (opcional) e WhatsApp.
export async function POST(req: NextRequest) {
  const { name, whatsapp, category } = await req.json();
  if (!name || !String(name).trim()) {
    return NextResponse.json({ error: "Informe o nome do membro." }, { status: 400 });
  }
  const cleanName = String(name).trim();

  const duplicate = await prisma.member.findFirst({
    where: { name: { equals: cleanName, mode: "insensitive" } },
  });
  if (duplicate) {
    return NextResponse.json({ error: "Já existe um membro cadastrado com esse nome." }, { status: 409 });
  }

  const username = await generateUniqueUsername(prisma, slugifyUsername(cleanName));
  const password = generatePassword();

  const member = await prisma.member.create({
    data: {
      name: cleanName,
      whatsapp: whatsapp || null,
      category: category || null,
      user: {
        create: {
          username,
          passwordHash: await bcrypt.hash(password, 10),
          role: "MEMBER",
          mustChangePassword: true,
        },
      },
    },
    include: { user: { select: { username: true } } },
  });

  // Vincula automaticamente relatórios já importados com esse nome (sem precisar reimportar)
  const linkedReports = await linkPastReports(member.id, cleanName);

  return NextResponse.json({ member, username, password, linkedReports }, { status: 201 });
}
