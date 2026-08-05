"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Prize } from "@/lib/gift";

export function GiftEditor({
  enabled: initEnabled,
  googleReviewUrl: initUrl,
  prizes: initPrizes,
}: {
  enabled: boolean;
  googleReviewUrl: string | null;
  prizes: Prize[];
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initEnabled);
  const [url, setUrl] = useState(initUrl ?? "");
  const [prizes, setPrizes] = useState<Prize[]>(
    initPrizes.length
      ? initPrizes
      : [
          { label: "Café offert", weight: 3 },
          { label: "-10% sur l'addition", weight: 2 },
          { label: "Dessert offert", weight: 1 },
          { label: "Encore raté !", weight: 4 },
        ]
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function setPrize(i: number, patch: Partial<Prize>) {
    setPrizes((p) => p.map((x, j) => (j === i ? { ...x, ...patch } : x)));
    setSaved(false);
  }
  function addPrize() {
    setPrizes((p) => [...p, { label: "", weight: 1 }]);
  }
  function removePrize(i: number) {
    setPrizes((p) => p.filter((_, j) => j !== i));
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewGiftEnabled: enabled,
        googleReviewUrl: url,
        reviewPrizes: prizes.filter((p) => p.label.trim()),
      }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  const input =
    "w-full rounded-xl bg-surface px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand";
  const validCount = prizes.filter((p) => p.label.trim()).length;

  return (
    <div className="space-y-5">
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => {
            setEnabled(e.target.checked);
            setSaved(false);
          }}
          className="h-5 w-5 accent-[var(--brand)]"
        />
        <span className="font-medium">Activer la roue des cadeaux</span>
      </label>

      <div>
        <label className="mb-1 block text-sm text-muted">
          Lien vers vos avis Google
        </label>
        <input
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setSaved(false);
          }}
          className={input}
          placeholder="https://g.page/r/…/review"
        />
        <p className="mt-1 text-xs text-muted">
          Sur Google, cherchez votre établissement → « Demander des avis » →
          copiez le lien. Laissez vide pour permettre de tourner sans avis.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm text-muted">
          Les lots (le « poids » = chance relative de tomber dessus)
        </label>
        <div className="space-y-2">
          {prizes.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={p.label}
                onChange={(e) => setPrize(i, { label: e.target.value })}
                placeholder="ex. Café offert"
                className="flex-1 rounded-xl bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
              />
              <input
                type="number"
                min={1}
                value={p.weight}
                onChange={(e) =>
                  setPrize(i, { weight: Math.max(1, Number(e.target.value) || 1) })
                }
                title="Poids (chance)"
                className="w-16 rounded-xl bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
              />
              <button
                onClick={() => removePrize(i)}
                className="px-2 py-2 text-muted hover:text-red-400"
                aria-label="Retirer ce lot"
              >
                🗑
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addPrize}
          className="mt-2 rounded-lg bg-surface px-3 py-2 text-sm"
        >
          + Ajouter un lot
        </button>
        <p className="mt-2 text-xs text-muted">
          Astuce : ajoutez un lot « perdant » (ex. « Encore raté ! ») avec un poids
          élevé pour maîtriser vos cadeaux. Il faut au moins 2 lots.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving || validCount < 2}
          className="rounded-xl bg-brand px-6 py-3 font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        {saved && <span className="text-sm text-emerald-400">Enregistré.</span>}
        {validCount < 2 && (
          <span className="text-sm text-muted">Ajoutez au moins 2 lots.</span>
        )}
      </div>
    </div>
  );
}
