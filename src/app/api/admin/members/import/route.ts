import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { slugifyUsername, generatePassword, generateUniqueUsername } from "@/lib/credentials";

// Parser CSV simples (RFC4180-ish): suporta campos entre aspas com vírgulas/aspas escapadas.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const s = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  row.push(field);
  rows.push(row);

  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

const HEADER_ALIASES: Record<string, string[]> = {
  name: ["nome", "nome completo", "nome do membro", "name"],
  whatsapp: ["whatsapp", "telefone", "celular", "phone"],
  category: ["categoria", "category", "cadeira"],
  email: ["email", "e-mail"],
};

function mapHeader(header: string[]): Record<string, number> {
  const norm = header.map((h) => h.trim().toLowerCase());
  const map: Record<string, number> = {};
  for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
    const idx = norm.findIndex((h) => aliases.includes(h));
    if (idx >= 0) map[key] = idx;
  }
  return map;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Envie um arquivo CSV." }, { status: 400 });

  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length === 0) {
    return NextResponse.json({ error: "Arquivo CSV vazio." }, { status: 400 });
  }

  const map = mapHeader(rows[0]);
  if (map.name === undefined) {
    return NextResponse.json(
      { error: 'Coluna "Nome" não encontrada no cabeçalho do CSV.' },
      { status: 400 }
    );
  }

  const existingMembers = await prisma.member.findMany({ select: { name: true } });
  const existingNames = new Set(existingMembers.map((m) => m.name.trim().toLowerCase()));
  const seenInFile = new Set<string>();

  const created: { name: string; username: string; password: string }[] = [];
  const skipped: { name: string; reason: string }[] = [];

  for (const cols of rows.slice(1)) {
    const name = (cols[map.name] || "").trim();
    if (!name) continue;
    const key = name.toLowerCase();

    if (existingNames.has(key)) {
      skipped.push({ name, reason: "já cadastrado" });
      continue;
    }
    if (seenInFile.has(key)) {
      skipped.push({ name, reason: "duplicado no arquivo" });
      continue;
    }
    seenInFile.add(key);

    const whatsapp = map.whatsapp !== undefined ? (cols[map.whatsapp] || "").trim() || null : null;
    const category = map.category !== undefined ? (cols[map.category] || "").trim() || null : null;
    const email = map.email !== undefined ? (cols[map.email] || "").trim() || null : null;

    const username = await generateUniqueUsername(prisma, slugifyUsername(name));
    const password = generatePassword();

    await prisma.member.create({
      data: {
        name,
        whatsapp,
        category,
        email,
        user: {
          create: {
            username,
            passwordHash: await bcrypt.hash(password, 10),
            role: "MEMBER",
            mustChangePassword: true,
          },
        },
      },
    });

    created.push({ name, username, password });
    existingNames.add(key);
  }

  return NextResponse.json({ created, skipped });
}
