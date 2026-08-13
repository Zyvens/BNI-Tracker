"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, BellOff } from "lucide-react";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export default function PushSubscribeToggle() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const ok = "serviceWorker" in navigator && "PushManager" in window && !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    setSupported(ok);
    if (!ok) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => {});
  }, []);

  async function subscribe() {
    setBusy(true);
    setError("");
    try {
      if (Notification.permission === "denied") {
        setError("Notificações bloqueadas no navegador. Ative nas permissões do site.");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Permissão de notificação não concedida.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      setSubscribed(true);
    } catch {
      setError("Não foi possível ativar as notificações.");
    } finally {
      setBusy(false);
    }
  }

  async function unsubscribe() {
    setBusy(true);
    setError("");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch {
      setError("Não foi possível desativar as notificações.");
    } finally {
      setBusy(false);
    }
  }

  if (!supported) return null;

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-4">
      <button
        type="button"
        onClick={subscribed ? unsubscribe : subscribe}
        disabled={busy}
        className="flex items-center justify-between w-full touch-manipulation disabled:opacity-60"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--tint-blue-bg)] flex items-center justify-center flex-shrink-0">
            {subscribed ? <Bell size={17} color="#2563EB" strokeWidth={2} /> : <BellOff size={17} color="#2563EB" strokeWidth={2} />}
          </div>
          <div className="text-left">
            <p className="text-[13px] font-extrabold text-text-main font-display">Notificações push</p>
            <p className="text-[10.5px] text-text-muted leading-snug mt-0.5">
              {subscribed ? "Ativas neste dispositivo" : "Receba alertas mesmo com o app fechado"}
            </p>
          </div>
        </div>
        <div
          className="w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ml-3"
          style={{ backgroundColor: subscribed ? "#22C55E" : "var(--color-track)" }}
        >
          <motion.div
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
            animate={{ left: subscribed ? 22 : 2 }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
          />
        </div>
      </button>
      {error && <p className="text-[10.5px] font-semibold text-primary mt-2">{error}</p>}
    </div>
  );
}
