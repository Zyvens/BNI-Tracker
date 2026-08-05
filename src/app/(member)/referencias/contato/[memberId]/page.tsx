import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ContatoClient from "./ContatoClient";

export const dynamic = "force-dynamic";

export default async function ContatoDetailPage({ params }: { params: { memberId: string } }) {
  const session = (await getSession())!;
  const me = session.memberId!;
  const otherId = params.memberId;
  if (otherId === me) notFound();

  const other = await prisma.member.findUnique({ where: { id: otherId } });
  if (!other) notFound();

  const [givenByMe, givenByThem, testimonialsToThem, testimonialsToMe] = await Promise.all([
    prisma.referral.findMany({
      where: { giverId: me, receiverId: otherId },
      orderBy: { dataISO: "desc" },
    }),
    prisma.referral.findMany({
      where: { giverId: otherId, receiverId: me },
      orderBy: { dataISO: "desc" },
    }),
    prisma.testimonial.findMany({ where: { fromId: me, toId: otherId }, orderBy: { dataISO: "desc" } }),
    prisma.testimonial.findMany({ where: { fromId: otherId, toId: me }, orderBy: { dataISO: "desc" } }),
  ]);

  const closedByThem = givenByMe.filter((r) => r.status === "fechada").length;
  const indirectFromThem = givenByThem.filter((r) => r.origem !== "referencia_direta");
  const indirectClosedByMe = indirectFromThem.filter((r) => r.status === "fechada").length;

  return (
    <ContatoClient
      other={{ id: other.id, name: other.name, company: other.company, category: other.category }}
      stats={{
        givenByMeCount: givenByMe.length,
        closedByThem,
        givenByThemCount: givenByThem.length,
        closedByMe: givenByThem.filter((r) => r.status === "fechada").length,
        indirectFromThemCount: indirectFromThem.length,
        indirectClosedByMe,
        testemunhosParaEle: testimonialsToThem.length,
        testemunhosParaMim: testimonialsToMe.length,
      }}
      refsGivenByMe={givenByMe.map((r) => ({ id: r.id, contactName: r.contactName, dataISO: r.dataISO, status: r.status }))}
      refsGivenByThem={givenByThem.map((r) => ({ id: r.id, contactName: r.contactName, dataISO: r.dataISO, status: r.status, origem: r.origem }))}
    />
  );
}
