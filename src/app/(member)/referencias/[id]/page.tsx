import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ReferralDetailClient from "./ReferralDetailClient";

export const dynamic = "force-dynamic";

export default async function ReferralDetailPage({ params }: { params: { id: string } }) {
  const session = (await getSession())!;
  const r = await prisma.referral.findUnique({
    where: { id: params.id },
    include: { giver: true, receiver: true, logs: { orderBy: { createdAt: "desc" } } },
  });

  if (!r || (r.giverId !== session.memberId && r.receiverId !== session.memberId)) notFound();

  return (
    <ReferralDetailClient
      referral={{
        id: r.id,
        isGiver: r.giverId === session.memberId,
        contactName: r.contactName,
        company: r.company,
        phone: r.phone,
        email: r.email,
        segment: r.segment,
        origem: r.origem,
        dataISO: r.dataISO,
        estimatedValue: r.estimatedValue,
        notes: r.notes,
        status: r.status,
        nextAction: r.nextAction,
        nextActionISO: r.nextActionISO,
        lostReason: r.lostReason,
        giverName: r.giver?.name ?? r.giverName,
        receiverName: r.receiver?.name ?? r.receiverName,
        declaredValue: r.declaredValue,
        declaredISO: r.declaredISO,
        confirmationStatus: r.confirmationStatus,
        confirmedValue: r.confirmedValue,
        heardInMeeting: r.heardInMeeting,
        inOfficialSystem: r.inOfficialSystem,
        logs: r.logs.map((l) => ({ id: l.id, dataISO: l.dataISO, tipo: l.tipo, texto: l.texto })),
      }}
    />
  );
}
