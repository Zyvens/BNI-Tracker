import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let s = await prisma.settings.findFirst();
  if (!s) s = await prisma.settings.create({ data: { id: 1 } });
  return NextResponse.json(s);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const data: Record<string, unknown> = {};
  for (const k of [
    "groupName",
    "goalRefs",
    "goalConvidados",
    "goal1a1",
    "goalUegs",
    "goalTestemunhos",
    "goalOpnf",
    "targetScore",
    "safetyMargin",
  ]) {
    if (body[k] !== undefined) data[k] = body[k];
  }
  if (body.meetingWeekday !== undefined) {
    data.meetingWeekday = body.meetingWeekday === null || body.meetingWeekday === "" ? null : parseInt(body.meetingWeekday);
  }
  const s = await prisma.settings.upsert({
    where: { id: 1 },
    create: { id: 1, ...data },
    update: data,
  });
  return NextResponse.json(s);
}
