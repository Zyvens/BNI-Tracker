import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import ConfiguracoesClient from "./ConfiguracoesClient";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const session = (await getSession())!;
  const theme = cookies().get("theme")?.value ?? "light";

  return <ConfiguracoesClient name={session.name} currentTheme={theme} />;
}
