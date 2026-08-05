"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function OrderingToggle({ paused: initial }: { paused: boolean }) {
  const router = useRouter();
  const [paused, setPaused] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    const next = !paused;
    setPaused(next);
    setSaving(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderingPaused: next }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div
      className={`flex items-center justify-between rounded-2xl border p-4 ${
        paused ? "border-amber-500/40 bg-amber-500/10" : "border-border bg-surface"
      }`}
    >
      <div>
        <p className="font-semibold">
          {paused ? "⏸️ Commandes fermées" : "🟢 Commandes ouvertes"}
        </p>
        <p className="text-xs text-muted">
          {paused
            ? "Les clients ne peuvent pas commander (ils voient toujours le menu)."
            : "Les clients peuvent commander depuis leur table."}
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={saving}
        className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${
          paused ? "bg-emerald-600" : "bg-amber-600"
        }`}
      >
        {paused ? "Rouvrir" : "Fermer"}
      </button>
    </div>
  );
}
