"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { THEMES, type Theme } from "@/lib/themes";

const ORDER: Theme[] = ["noir", "blanc-casse", "rose-pastel", "vert-pastel"];

export function ThemePicker({
  currentTheme,
  brandColor,
}: {
  currentTheme: string;
  brandColor: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Theme>(
    (currentTheme in THEMES ? currentTheme : "noir") as Theme
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: selected }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {ORDER.map((key) => {
          const t = THEMES[key];
          const p = t.palette;
          const active = selected === key;
          return (
            <button
              key={key}
              onClick={() => setSelected(key)}
              className={`rounded-2xl p-1.5 text-left transition ${
                active ? "ring-2 ring-brand" : "ring-1 ring-border"
              }`}
            >
              {/* Aperçu réaliste du menu dans ce fond */}
              <div
                className="overflow-hidden rounded-xl"
                style={{ background: p.bg, color: p.text }}
              >
                <div className="space-y-2 p-3">
                  <div
                    className="h-16 rounded-lg"
                    style={{ background: p.surface2 }}
                  />
                  <div
                    className="h-2 w-2/3 rounded-full"
                    style={{ background: p.text, opacity: 0.85 }}
                  />
                  <div
                    className="h-2 w-1/2 rounded-full"
                    style={{ background: p.muted }}
                  />
                  <div className="flex items-center justify-between pt-1">
                    <div
                      className="h-2 w-10 rounded-full"
                      style={{ background: p.text, opacity: 0.85 }}
                    />
                    <div
                      className="rounded-full px-2.5 py-1 text-[9px] font-semibold text-white"
                      style={{ background: brandColor }}
                    >
                      Ajouter
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 px-1.5 py-2">
                <span
                  className="h-3 w-3 rounded-full ring-1 ring-black/10"
                  style={{ background: t.swatch }}
                />
                <span className="text-sm font-medium">{t.label}</span>
                {active && <span className="ml-auto text-brand">✓</span>}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-brand px-6 py-3 font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "Enregistrer le fond"}
        </button>
        {saved && (
          <span className="text-sm text-emerald-400">
            Enregistré — visible sur le menu de vos clients.
          </span>
        )}
      </div>
    </div>
  );
}
