import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getGoals } from "@/lib/snapshot";
import { computeScore } from "@/lib/engine";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const goals = await getGoals();
  const [memberCount, reportCount, lastReport] = await Promise.all([
    prisma.member.count({ where: { active: true } }),
    prisma.report.count(),
    prisma.report.findFirst({
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: { performanceRecords: { include: { member: true } } },
    }),
  ]);

  const rows = (lastReport?.performanceRecords ?? [])
    .map((r) => ({
      name: r.memberName,
      linked: !!r.memberId,
      points: r.totalPoints,
    }))
    .sort((a, b) => b.points - a.points);

  const verde = rows.filter((r) => r.points >= 70).length;
  const cem = rows.filter((r) => r.points >= 100).length;
  const vermelho = rows.filter((r) => r.points < 40).length;

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Membros ativos", value: memberCount, href: "/admin/membros" },
          { label: "Relatórios", value: reportCount, href: "/admin/relatorios" },
          { label: "Clube 100", value: cem, href: "#" },
        ].map((s) => (
          <Link key={s.label} href={s.href}>
            <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col items-center touch-manipulation">
              <span className="text-[24px] font-extrabold font-display text-text-main">{s.value}</span>
              <span className="text-[10px] text-text-muted font-semibold text-center">{s.label}</span>
            </div>
          </Link>
        ))}
      </div>

      {lastReport ? (
        <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <div>
              <p className="text-[14px] font-extrabold text-text-main font-display">
                Semáforo — {String(lastReport.month).padStart(2, "0")}/{lastReport.year}
              </p>
              <p className="text-[10px] text-text-muted">
                🟢 {verde} no verde · 🔴 {vermelho} críticos · 🏆 {cem} no Clube 100
              </p>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {rows.map((r) => {
              const color = r.points >= 100 ? "#D97706" : r.points >= 70 ? "#16A34A" : r.points >= 40 ? "#D97706" : "#CC0000";
              return (
                <div key={r.name} className="px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[13px] font-semibold text-text-main truncate">{r.name}</span>
                    {!r.linked && (
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        sem login
                      </span>
                    )}
                  </div>
                  <span className="text-[14px] font-extrabold font-display flex-shrink-0" style={{ color }}>
                    {r.points >= 100 ? "🏆 " : ""}{r.points}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-gray-100 p-8 flex flex-col items-center text-center">
          <p className="text-[14px] font-bold text-text-main font-display">Nenhum relatório importado</p>
          <p className="text-[11px] text-text-muted mt-1 mb-4">
            Importe o PDF &quot;Semáforos&quot; para ver a visão geral do capítulo.
          </p>
          <Link href="/admin/relatorios" className="px-4 py-2.5 rounded-2xl bg-primary text-white text-[13px] font-bold touch-manipulation">
            Importar relatório
          </Link>
        </div>
      )}

      <p className="text-[10px] text-text-muted text-center">
        Meta configurada: {goals.refDadas} refs · {goals.convidados} convidados · {goals.reunioes1a1} 1-a-1 ·{" "}
        {goals.uegs} UEGs · {goals.testemunhos} testemunhos · R$ {goals.opnf.toLocaleString("pt-BR")} OPNF
      </p>
    </div>
  );
}
