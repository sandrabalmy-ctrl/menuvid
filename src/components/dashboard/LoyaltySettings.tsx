"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoyaltySettings({
  enabled,
  threshold,
  reward,
}: {
  enabled: boolean;
  threshold: number;
  reward: string;
}) {
  const router = useRouter();
  const [on, setOn] = useState(enabled);
  const [th, setTh] = useState(threshold);
  const [rw, setRw] = useState(reward);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save(next: object) {
    setSaving(true);
    setSaved(false);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  const input =
    "rounded-xl bg-surface px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand";

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={on}
          onChange={(e) => {
            setOn(e.target.checked);
            save({ loyaltyEnabled: e.target.checked });
          }}
          className="h-5 w-5 accent-[var(--brand)]"
        />
        <span>
          Activer la <b>carte de fidélité</b> (vos clients créent un compte et
          cumulent des points)
        </span>
      </label>

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-muted">Nombre de visites</span>
          <input
            type="number"
            min={1}
            max={100}
            value={th}
            onChange={(e) => setTh(Math.max(1, Number(e.target.value) || 1))}
            className={`${input} w-28`}
          />
        </label>
        <span className="pb-3 text-muted">=</span>
        <label className="flex-1 text-sm">
          <span className="mb-1 block text-muted">Récompense</span>
          <input
            value={rw}
            onChange={(e) => setRw(e.target.value)}
            placeholder="ex. Un plat offert"
            className={`${input} w-full`}
          />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => save({ loyaltyThreshold: th, loyaltyReward: rw })}
          disabled={saving}
          className="rounded-xl bg-brand px-6 py-3 font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        {saved && <span className="text-sm text-emerald-500">Enregistré.</span>}
      </div>

      <p className="text-xs text-muted">
        1 commande = 1 visite = 1 point. Au seuil atteint, le client voit sa
        récompense et la présente au personnel.
      </p>
    </div>
  );
}
