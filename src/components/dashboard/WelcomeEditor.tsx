"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function WelcomeEditor({
  restaurantName,
  current,
}: {
  restaurantName: string;
  current: string | null;
}) {
  const router = useRouter();
  const [text, setText] = useState(current ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ welcomeMessage: text }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  const placeholder = `Bonjour et bienvenue chez ${restaurantName} ! Installez-vous, découvrez nos plats en vidéo et commandez directement depuis votre table.`;

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSaved(false);
        }}
        rows={3}
        maxLength={400}
        placeholder={placeholder}
        className="w-full rounded-xl bg-surface px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand"
      />
      <div className="flex items-center justify-between text-xs text-muted">
        <span>Laissez vide pour masquer l’encadré.</span>
        <span>{text.length}/400</span>
      </div>

      {/* Aperçu de l'encadré tel qu'il apparaîtra */}
      {text.trim() && (
        <div>
          <p className="mb-1 text-xs text-muted">Aperçu :</p>
          <div className="rounded-2xl border border-border bg-surface px-4 py-3">
            <p className="whitespace-pre-line text-sm leading-relaxed">{text}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-brand px-6 py-3 font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "Enregistrer le message"}
        </button>
        {saved && (
          <span className="text-sm text-emerald-400">Enregistré.</span>
        )}
      </div>
    </div>
  );
}
