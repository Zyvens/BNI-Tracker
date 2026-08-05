import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session?.memberId) return NextResponse.json({ error: "Sem membro vinculado" }, { status: 403 });

  const notes = await prisma.voiceNote.findMany({
    where: { memberId: session.memberId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json(notes);
}

// Cap defensivo do payload de áudio (base64) — gravação é limitada a ~90s no cliente,
// isso é só uma rede de segurança contra payloads fora do fluxo normal.
const MAX_AUDIO_CHARS = 4_000_000;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.memberId) return NextResponse.json({ error: "Sem membro vinculado" }, { status: 403 });

  const b = await req.json();
  const audioData = typeof b.audioData === "string" ? b.audioData : null;
  const text = typeof b.text === "string" ? b.text.trim() : "";
  if (!audioData && !text) return NextResponse.json({ error: "Grave um áudio ou escreva uma nota." }, { status: 400 });
  if (audioData && audioData.length > MAX_AUDIO_CHARS) {
    return NextResponse.json({ error: "Áudio muito longo." }, { status: 400 });
  }

  const note = await prisma.voiceNote.create({
    data: {
      memberId: session.memberId,
      contactName: b.contactName || null,
      audioData,
      durationSec: typeof b.durationSec === "number" ? Math.round(b.durationSec) : null,
      text: text || null,
    },
  });
  return NextResponse.json(note);
}
