"use client";

import { useEffect, useState } from "react";

const PRESETS = [10, 15, 20, 30, 45, 60];

// Réglage rapide du temps d'attente estimé montré au client.
export function EtaControl({ compact = false }: { compact?: boolean }) {
  const [minutes, setMinutes] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/eta", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setMinutes(j.minutes ?? 20))
      .catch(() => setMinutes(20));
  }, []);

  async function set(m: number) {
    setBusy(true);
    setMinutes(m); // optimiste
    await fetch("/api/dashboard/eta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ minutes: m }),
    }).catch(() => {});
    setBusy(false);
  }

  return (
    <div
      className={`rounded-2xl border border-border bg-surface ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <p className="mb-2 text-sm font-medium">
        ⏱️ Temps d’attente annoncé au client
        {minutes != null && (
          <span className="ml-2 font-bold text-brand">~{minutes} min</span>
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((m) => (
          <button
            key={m}
            onClick={() => set(m)}
            disabled={busy}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition disabled:opacity-60 ${
              minutes === m
                ? "border-brand bg-brand/15 text-brand"
                : "border-border bg-bg text-muted hover:text-text"
            }`}
          >
            {m} min
          </button>
        ))}
      </div>
    </div>
  );
}
