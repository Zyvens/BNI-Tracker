import crypto from "crypto";
import type { prisma as PrismaInstance } from "@/lib/prisma";

// Gera um usuário previsível a partir do nome: primeiro + último nome, sem acentos.
// "Renata Mattos Guimarães" -> "renata.guimaraes"
export function slugifyUsername(fullName: string): string {
  const parts = fullName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacríticos (acentos)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "membro";
  if (parts.length === 1) return parts[0];
  return `${parts[0]}.${parts[parts.length - 1]}`;
}

// Senha aleatória fácil de digitar (sem 0/O/1/l/I ambíguos). O membro troca no 1º acesso.
export function generatePassword(length = 10): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[crypto.randomInt(0, alphabet.length)];
  }
  return out;
}

// Garante que o usuário gerado não colide com um já existente.
export async function generateUniqueUsername(
  prisma: typeof PrismaInstance,
  base: string
): Promise<string> {
  let candidate = base;
  let n = 2;
  // eslint-disable-next-line no-await-in-loop
  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    candidate = `${base}${n}`;
    n++;
  }
  return candidate;
}
