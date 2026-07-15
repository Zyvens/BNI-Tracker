"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutGrid, Users, FileUp, Settings } from "lucide-react";

const TABS = [
  { path: "/admin", label: "Visão Geral", icon: LayoutGrid },
  { path: "/admin/membros", label: "Membros", icon: Users },
  { path: "/admin/relatorios", label: "Relatórios", icon: FileUp },
  { path: "/admin/config", label: "Regras", icon: Settings },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-surface border-t border-gray-100 z-40"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center h-14 max-w-3xl mx-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = tab.path === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.path);
          return (
            <Link key={tab.path} href={tab.path} className="flex flex-col items-center justify-center flex-1 h-full touch-manipulation">
              <motion.div className="flex flex-col items-center gap-0.5 relative" whileTap={{ scale: 0.88 }}>
                <Icon size={20} strokeWidth={active ? 2.2 : 1.7} color={active ? "#CC0000" : "#8A8A8E"} />
                <span className="text-[9px] font-medium" style={{ color: active ? "#CC0000" : "#8A8A8E" }}>
                  {tab.label}
                </span>
                {active && (
                  <motion.div layoutId="admin-tab" className="absolute -top-px h-0.5 w-8 rounded-full bg-primary" />
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
