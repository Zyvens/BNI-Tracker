import { getSession } from "@/lib/auth";
import { getFeedItem } from "@/lib/feed";
import AtividadeClient from "./AtividadeClient";

export const dynamic = "force-dynamic";

export default async function AtividadePage({ params }: { params: { id: string } }) {
  const session = (await getSession())!;
  const item = await getFeedItem(session.memberId!, params.id);

  return <AtividadeClient item={item} />;
}
