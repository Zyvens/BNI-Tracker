import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ConfiguracoesClient from "./ConfiguracoesClient";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const session = (await getSession())!;
  const theme = cookies().get("theme")?.value ?? "light";
  const member = await prisma.member.findUnique({
    where: { id: session.memberId! },
    select: { showInRanking: true },
  });

  return (
    <ConfiguracoesClient
      name={session.name}
      currentTheme={theme}
      showInRanking={member?.showInRanking ?? false}
    />
  );
}
