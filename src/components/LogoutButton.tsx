"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      title="Sair"
      onClick={logout}
      className={
        className ??
        "w-9 h-9 rounded-full bg-background flex items-center justify-center touch-manipulation flex-shrink-0"
      }
    >
      <LogOut size={16} className="text-text-muted" strokeWidth={2} />
    </button>
  );
}
