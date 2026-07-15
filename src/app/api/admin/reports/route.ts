import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseSemaforosPdf } from "@/lib/pdfParser";

export const dynamic = "force-dynamic";

export async function GET() {
  const reports = await prisma.report.findMany({
    include: { _count: { select: { performanceRecords: true } } },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
  return NextResponse.json(reports);
}

// Importa o PDF mensal "Semáforos"
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const month = parseInt(formData.get("month") as string);
    const year = parseInt(formData.get("year") as string);

    if (!file || isNaN(month) || isNaN(year)) {
      return NextResponse.json({ error: "Envie o arquivo, mês e ano." }, { status: 400 });
    }

    const existing = await prisma.report.findFirst({ where: { month, year } });
    if (existing) {
      return NextResponse.json({ error: "Já existe um relatório importado para este mês e ano." }, { status: 409 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const records = await parseSemaforosPdf(buffer);

    if (records.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum membro encontrado. Verifique se é o PDF "Semáforos" correto.' },
        { status: 400 }
      );
    }

    const dbMembers = await prisma.member.findMany();
    const report = await prisma.report.create({ data: { month, year } });

    let matched = 0;
    const unmatched: string[] = [];

    for (const r of records) {
      const member = dbMembers.find((m) => m.name.toLowerCase() === r.name.toLowerCase());
      await prisma.performanceRecord.create({
        data: {
          memberName: r.name,
          memberId: member?.id ?? null,
          reportId: report.id,
          presences: r.p,
          absences: r.a,
          late: r.l,
          monitored: r.m,
          substitutions: r.s,
          referralsGiven: r.rd,
          referralsReceived: r.rr,
          oneToOnes: r.one_to_one,
          visitors: r.c,
          testimonials: r.t,
          ceu: r.f,
          tyfcb: r.onf,
          pointsAbsences: r.pts_a,
          pointsLate: r.pts_l,
          pointsReferrals: r.pts_rd,
          pointsOneToOnes: r.pts_121,
          pointsVisitors: r.pts_c,
          pointsTestimonials: r.pts_t,
          pointsCeu: r.pts_f,
          pointsTyfcb: r.pts_onf,
          totalPoints: r.pts_total,
        },
      });
      if (member) matched++;
      else unmatched.push(r.name);
    }

    return NextResponse.json({
      message: "Relatório processado",
      reportId: report.id,
      totalFound: records.length,
      matched,
      unmatched,
    });
  } catch (err) {
    console.error("Erro ao importar relatório:", err);
    return NextResponse.json({ error: "Erro interno ao processar o arquivo." }, { status: 500 });
  }
}
