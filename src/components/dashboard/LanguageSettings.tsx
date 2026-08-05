"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LanguageSettings({
  offerEnglish,
  welcomeMessageEn,
}: {
  offerEnglish: boolean;
  welcomeMessageEn: string | null;
}) {
  const router = useRouter();
  const [on, setOn] = useState(offerEnglish);
  const [welcomeEn, setWelcomeEn] = useState(welcomeMessageEn ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save(next: {
    offerEnglish?: boolean;
    welcomeMessageEn?: string;
  }) {
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

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={on}
          onChange={(e) => {
            setOn(e.target.checked);
            save({ offerEnglish: e.target.checked });
          }}
          className="h-5 w-5 accent-[var(--brand)]"
        />
        <span>
          Proposer le menu en <b>anglais</b> (bouton FR/EN pour le client)
        </span>
      </label>

      <div>
        <label className="mb-1 block text-sm text-muted">
          Message d’accueil en anglais
        </label>
        <textarea
          value={welcomeEn}
          onChange={(e) => {
            setWelcomeEn(e.target.value);
            setSaved(false);
          }}
          rows={3}
          maxLength={400}
          placeholder="Welcome message in English…"
          className="w-full rounded-xl bg-surface px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => save({ welcomeMessageEn: welcomeEn })}
          disabled={saving}
          className="rounded-xl bg-brand px-6 py-3 font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        {saved && <span className="text-sm text-emerald-400">Enregistré.</span>}
      </div>

      <p className="text-xs text-muted">
        Traduisez ensuite chaque plat (champ « 🇬🇧 anglais » dans l’édition du plat)
        et le nom des catégories. Sans traduction, le français s’affiche.
      </p>
    </div>
  );
}
