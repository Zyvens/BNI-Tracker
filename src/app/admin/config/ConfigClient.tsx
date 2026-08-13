"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Save } from "lucide-react";

type Settings = {
  groupName: string;
  goalRefs: number;
  goalConvidados: number;
  goal1a1: number;
  goalUegs: number;
  goalTestemunhos: number;
  goalOpnf: number;
  targetScore: number;
  safetyMargin: number;
  meetingWeekday: number | null;
};

const WEEKDAYS = [
  { v: 0, label: "Domingo" },
  { v: 1, label: "Segunda" },
  { v: 2, label: "Terça" },
  { v: 3, label: "Quarta" },
  { v: 4, label: "Quinta" },
  { v: 5, label: "Sexta" },
  { v: 6, label: "Sábado" },
];

const FIELDS: { key: keyof Settings; label: string; hint?: string }[] = [
  { key: "goalRefs", label: "Referências dadas (semestre)", hint: "padrão 27 (~1/semana)" },
  { key: "goalConvidados", label: "Convidados (semestre)", hint: "padrão 8" },
  { key: "goal1a1", label: "Reuniões 1-a-1 (semestre)", hint: "padrão 22" },
  { key: "goalUegs", label: "UEGs (semestre)", hint: "padrão 22" },
  { key: "goalTestemunhos", label: "Testemunhos (semestre)", hint: "padrão 2" },
  { key: "goalOpnf", label: "OPNF em R$ (semestre)", hint: "padrão 20.000" },
  { key: "targetScore", label: "Meta de pontuação", hint: "padrão 100" },
  { key: "safetyMargin", label: "Margem de segurança (pts)", hint: "padrão 10" },
];

export default function ConfigClient({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [form, setForm] = useState<Settings>(settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function submit() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3.5">
        <p className="text-[14px] font-extrabold text-text-main font-display">Regras da Equipe</p>
        <p className="text-[11px] text-text-muted -mt-2">
          As metas podem variar por equipe, região ou metodologia. Os valores abaixo alimentam o semáforo,
          o plano de ação e as projeções de todos os membros.
        </p>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1.5 block">
            Nome do grupo
          </label>
          <input
            className="w-full bg-background rounded-xl px-3.5 py-3 text-[13px] font-semibold outline-none border-2 border-transparent focus:border-primary"
            value={form.groupName}
            onChange={(e) => setForm({ ...form, groupName: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1 block leading-tight">
                {f.label}
              </label>
              <input
                type="number"
                className="w-full bg-background rounded-xl px-3.5 py-3 text-[14px] font-extrabold font-display outline-none border-2 border-transparent focus:border-primary"
                value={form[f.key] as number}
                onChange={(e) => setForm({ ...form, [f.key]: parseFloat(e.target.value) || 0 })}
              />
              {f.hint && <p className="text-[9px] text-text-muted mt-0.5">{f.hint}</p>}
            </div>
          ))}
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1.5 block">
            Dia da reunião
          </label>
          <div className="grid grid-cols-4 gap-2">
            {WEEKDAYS.map((d) => (
              <button
                key={d.v}
                type="button"
                onClick={() => setForm({ ...form, meetingWeekday: form.meetingWeekday === d.v ? null : d.v })}
                className="h-10 rounded-xl text-[11px] font-bold touch-manipulation border-2 transition-colors"
                style={{
                  backgroundColor: form.meetingWeekday === d.v ? "var(--tint-red-bg)" : "var(--color-track-soft)",
                  borderColor: form.meetingWeekday === d.v ? "#CC0000" : "transparent",
                  color: form.meetingWeekday === d.v ? "#CC0000" : "#8A8A8E",
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
          <p className="text-[9px] text-text-muted mt-1.5">
            Ativa o check-in rápido de presença no Dashboard dos membros nesse dia da semana.
          </p>
        </div>

        {saved && (
          <p className="text-[12px] font-semibold text-green-700 bg-green-50 rounded-xl px-3 py-2">
            ✓ Regras salvas. Os dashboards dos membros já refletem as novas metas.
          </p>
        )}

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={submit}
          disabled={saving}
          className="w-full h-12 rounded-2xl bg-primary flex items-center justify-center gap-2 touch-manipulation disabled:opacity-60"
        >
          <Save size={16} color="white" strokeWidth={2.5} />
          <span className="text-white font-bold text-[14px]">{saving ? "Salvando..." : "Salvar regras"}</span>
        </motion.button>
      </div>
    </div>
  );
}
