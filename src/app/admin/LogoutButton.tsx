"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      }}
      className="text-[11px] font-bold text-text-muted bg-background px-3 py-1.5 rounded-full touch-manipulation"
    >
      Sair
    </button>
  );
}
