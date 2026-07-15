import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session?.memberId) return NextResponse.json({ error: "Sem membro vinculado" }, { status: 403 });
  const guests = await prisma.guest.findMany({
    where: { memberId: session.memberId },
    orderBy: { inviteISO: "desc" },
  });
  return NextResponse.json(guests);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.memberId) return NextResponse.json({ error: "Sem membro vinculado" }, { status: 403 });

  const b = await req.json();
  if (!b.name || !b.inviteISO) {
    return NextResponse.json({ error: "Informe o nome e a data do convite." }, { status: 400 });
  }

  const guest = await prisma.guest.create({
    data: {
      memberId: session.memberId,
      name: String(b.name).trim(),
      company: b.company || null,
      category: b.category || null,
      phone: b.phone || null,
      email: b.email || null,
      inviteISO: b.inviteISO,
      meetingISO: b.meetingISO || null,
      confirmed: !!b.confirmed,
      notes: b.notes || null,
    },
  });
  return NextResponse.json(guest, { status: 201 });
}
