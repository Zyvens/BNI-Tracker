"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, X, Trash2, Loader2 } from "lucide-react";

type Note = {
  id: string;
  contactName: string | null;
  audioData: string | null;
  durationSec: number | null;
  text: string | null;
  createdAt: string;
};

const MAX_SECONDS = 90;

export default function VoiceNoteFab() {
  const [open, setOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [contactName, setContactName] = useState("");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState<Note[] | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  function resetRecording() {
    setAudioUrl(null);
    setAudioBase64(null);
    setSeconds(0);
  }

  async function openSheet() {
    setOpen(true);
    setError("");
    try {
      const res = await fetch("/api/voice-notes");
      if (res.ok) setNotes(await res.json());
    } catch {
      // silencioso: lista é conveniência, não bloqueia a gravação
    }
  }

  async function startRecording() {
    setError("");
    resetRecording();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        const reader = new FileReader();
        reader.onloadend = () => setAudioBase64(reader.result as string);
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS) {
            stopRecording();
            return MAX_SECONDS;
          }
          return s + 1;
        });
      }, 1000);
    } catch {
      setError("Não foi possível acessar o microfone. Verifique a permissão do navegador.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  async function save() {
    if (!audioBase64 && !text.trim()) {
      setError("Grave um áudio ou escreva uma nota.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/voice-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: contactName.trim() || null,
          audioData: audioBase64,
          durationSec: seconds,
          text: text.trim() || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Erro ao salvar.");
        return;
      }
      resetRecording();
      setContactName("");
      setText("");
      const list = await fetch("/api/voice-notes");
      if (list.ok) setNotes(await list.json());
    } finally {
      setSaving(false);
    }
  }

  async function removeNote(id: string) {
    await fetch(`/api/voice-notes/${id}`, { method: "DELETE" });
    setNotes((prev) => (prev ? prev.filter((n) => n.id !== id) : prev));
  }

  function close() {
    if (recording) stopRecording();
    setOpen(false);
    resetRecording();
    setError("");
  }

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={openSheet}
        className="fixed z-40 flex items-center justify-center w-14 h-14 rounded-full touch-manipulation"
        style={{
          right: "16px",
          bottom: "calc(env(safe-area-inset-bottom) + 72px)",
          backgroundColor: "#CC0000",
          boxShadow: "0 6px 20px rgba(204,0,0,0.4)",
        }}
        aria-label="Gravar nota de voz"
      >
        <Mic size={22} color="white" strokeWidth={2.2} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end"
            style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
            onClick={(e) => e.target === e.currentTarget && close()}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="w-full bg-surface rounded-t-3xl overflow-hidden max-h-[88dvh] flex flex-col"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <h2 className="text-[16px] font-extrabold text-text-main font-display">Nota de voz</h2>
                <button onClick={close} className="w-8 h-8 rounded-full bg-background flex items-center justify-center touch-manipulation">
                  <X size={16} className="text-text-muted" strokeWidth={2.5} />
                </button>
              </div>

              <div className="px-5 py-4 space-y-4 overflow-y-auto">
                {/* Gravação */}
                <div className="bg-background rounded-2xl p-4 flex flex-col items-center gap-3">
                  {!audioUrl ? (
                    <>
                      <motion.button
                        whileTap={{ scale: 0.94 }}
                        onClick={recording ? stopRecording : startRecording}
                        className="w-16 h-16 rounded-full flex items-center justify-center touch-manipulation"
                        style={{ backgroundColor: recording ? "#3F3F46" : "#CC0000" }}
                        animate={recording ? { scale: [1, 1.06, 1] } : {}}
                        transition={{ repeat: recording ? Infinity : 0, duration: 1 }}
                      >
                        {recording ? <Square size={20} color="white" fill="white" /> : <Mic size={22} color="white" />}
                      </motion.button>
                      <p className="text-[12px] font-bold text-text-main">
                        {recording ? `Gravando... ${seconds}s / ${MAX_SECONDS}s` : "Toque para gravar"}
                      </p>
                    </>
                  ) : (
                    <div className="w-full flex flex-col items-center gap-2">
                      <audio controls src={audioUrl} className="w-full" />
                      <button onClick={resetRecording} className="text-[11px] font-bold text-primary flex items-center gap-1 touch-manipulation">
                        <Trash2 size={12} /> Descartar e regravar
                      </button>
                    </div>
                  )}
                </div>

                <input
                  className="w-full bg-background rounded-xl px-3.5 py-3 text-[13px] font-semibold outline-none border-2 border-transparent focus:border-primary transition-colors"
                  placeholder="Vincular a um contato/registro (opcional)"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
                <textarea
                  rows={2}
                  className="w-full bg-background rounded-xl px-3.5 py-3 text-[13px] font-medium outline-none border-2 border-transparent focus:border-primary transition-colors resize-none"
                  placeholder="Nota escrita (opcional, além do áudio)"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />

                {error && <p className="text-[12px] font-semibold text-primary bg-[var(--tint-red-bg)] rounded-xl px-3 py-2">{error}</p>}

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={save}
                  disabled={saving || (!audioBase64 && !text.trim())}
                  className="w-full h-12 rounded-2xl bg-primary flex items-center justify-center gap-2 touch-manipulation disabled:opacity-50"
                >
                  {saving && <Loader2 size={14} color="white" className="animate-spin" />}
                  <span className="text-white font-bold text-[14px]">{saving ? "Salvando..." : "Salvar nota"}</span>
                </motion.button>

                {notes && notes.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">Últimas notas</p>
                    <div className="space-y-2">
                      {notes.map((n) => (
                        <div key={n.id} className="bg-background rounded-xl p-3">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[11px] font-bold text-text-main truncate">
                              {n.contactName || "Sem contato vinculado"}
                            </span>
                            <button onClick={() => removeNote(n.id)} className="text-text-muted touch-manipulation">
                              <Trash2 size={12} />
                            </button>
                          </div>
                          {n.audioData && (
                            <audio controls src={n.audioData} className="w-full h-8" />
                          )}
                          {n.text && <p className="text-[11px] text-text-muted mt-1">{n.text}</p>}
                          <p className="text-[9px] text-text-muted mt-1">
                            {new Date(n.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
