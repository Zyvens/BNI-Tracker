import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminNav from "./AdminNav";
import LogoutButton from "./LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/");

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      <div
        className="bg-surface border-b border-gray-100 sticky top-0 z-30"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="px-4 h-14 flex items-center justify-between max-w-3xl mx-auto w-full">
          <div>
            <h1 className="text-[17px] font-extrabold text-text-main font-display">BNI Tracker</h1>
            <p className="text-[11px] text-text-muted">Painel do Coordenador</p>
          </div>
          <LogoutButton />
        </div>
      </div>
      <div className="flex-1 w-full max-w-3xl mx-auto pb-24">{children}</div>
      <AdminNav />
    </div>
  );
}
