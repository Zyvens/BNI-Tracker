import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ConvidadosClient from "./ConvidadosClient";

export const dynamic = "force-dynamic";

// Regra da equipe: cada convidado só pode visitar até 2 vezes por semestre
// (Jan–Jun / Jul–Dez); no semestre seguinte o contador reseta.
const VISITS_PER_SEMESTER = 2;

function semesterKey(iso: string) {
  const d = new Date(iso + "T00:00:00");
  const half = d.getMonth() < 6 ? "H1" : "H2";
  return `${d.getFullYear()}-${half}`;
}

function semesterLabel(key: string) {
  const [year, half] = key.split("-");
  return `${half === "H1" ? "1º" : "2º"} semestre de ${year}`;
}

export default async function ConvidadosPage() {
  const session = (await getSession())!;
  const guests = await prisma.guest.findMany({
    where: { memberId: session.memberId! },
    orderBy: { inviteISO: "asc" },
  });

  const todaySemester = semesterKey(new Date().toISOString().slice(0, 10));

  // Agrupa por nome (mesma pessoa convidada mais de uma vez = múltiplas linhas Guest)
  const groups = new Map<string, typeof guests>();
  for (const g of guests) {
    const key = g.name.trim().toLowerCase();
    const arr = groups.get(key) ?? [];
    arr.push(g);
    groups.set(key, arr);
  }

  const people = Array.from(groups.values()).map((rows) => {
    // Ordena por data da visita (reunião escolhida, senão data do convite)
    const sorted = [...rows].sort((a, b) => (a.meetingISO ?? a.inviteISO).localeCompare(b.meetingISO ?? b.inviteISO));
    const semesterCounts = new Map<string, number>();
    const visits = sorted.map((g) => {
      const visitISO = g.meetingISO ?? g.inviteISO;
      const attended = g.attended;
      let order: number | null = null;
      let semKey: string | null = null;
      let overLimit = false;
      if (attended) {
        semKey = semesterKey(visitISO);
        order = (semesterCounts.get(semKey) ?? 0) + 1;
        semesterCounts.set(semKey, order);
        overLimit = order > VISITS_PER_SEMESTER;
      }
      return {
        id: g.id,
        name: g.name,
        company: g.company,
        category: g.category,
        phone: g.phone,
        inviteISO: g.inviteISO,
        meetingISO: g.meetingISO,
        confirmed: g.confirmed,
        attended: g.attended,
        interested: g.interested,
        becameMember: g.becameMember,
        notes: g.notes,
        visitOrder: order,
        semesterKey: semKey,
        semesterLabel: semKey ? semesterLabel(semKey) : null,
        overLimit,
      };
    });

    const currentSemesterCount = semesterCounts.get(todaySemester) ?? 0;
    const latest = sorted[sorted.length - 1];

    return {
      key: latest.name.trim().toLowerCase(),
      name: latest.name,
      company: latest.company,
      category: latest.category,
      totalVisits: sorted.filter((g) => g.attended).length,
      currentSemesterCount,
      remainingThisSemester: Math.max(VISITS_PER_SEMESTER - currentSemesterCount, 0),
      limitReached: currentSemesterCount >= VISITS_PER_SEMESTER,
      visits,
    };
  });

  // Mais recentes primeiro
  people.sort((a, b) => {
    const aLast = a.visits[a.visits.length - 1]?.inviteISO ?? "";
    const bLast = b.visits[b.visits.length - 1]?.inviteISO ?? "";
    return bLast.localeCompare(aLast);
  });

  return <ConvidadosClient people={people} visitsPerSemester={VISITS_PER_SEMESTER} />;
}
