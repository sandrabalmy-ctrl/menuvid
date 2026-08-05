"use client";

import { useMemo, useState } from "react";
import type { FormuleDTO } from "@/lib/menu";
import { formatPrice } from "@/lib/format";
import { useCart } from "./cart";
import { useLang } from "./lang";
import { pick } from "@/lib/i18n";

export function FormuleSheet({
  formule,
  currency,
  canOrder,
  onClose,
}: {
  formule: FormuleDTO;
  currency: string;
  canOrder: boolean;
  onClose: () => void;
}) {
  const cart = useCart();
  const { lang, t } = useLang();
  const [note, setNote] = useState("");

  // Pré-sélectionne le 1er plat de chaque étape (modifiable).
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    formule.steps.forEach((s) => {
      if (s.choices[0]) init[s.id] = s.choices[0].id;
    });
    return init;
  });

  const allChosen = formule.steps.every((s) => selected[s.id]);

  // Composition ordonnée par étape + texte lisible ("Entrée: Salade · …").
  const { choiceDishIds, text } = useMemo(() => {
    const ids: string[] = [];
    const parts: string[] = [];
    for (const s of formule.steps) {
      const id = selected[s.id];
      ids.push(id);
      const c = s.choices.find((x) => x.id === id);
      if (c) {
        parts.push(`${pick(lang, s.name, s.nameEn)}: ${pick(lang, c.name, c.nameEn)}`);
      }
    }
    return { choiceDishIds: ids, text: parts.join(" · ") };
  }, [formule.steps, selected, lang]);

  function add() {
    cart.addFormule(formule, choiceDishIds, text, 1, note.trim() || undefined);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60 animate-fade-in" onClick={onClose} />
      <div className="relative max-h-[90vh] overflow-y-auto rounded-t-3xl border-t border-border bg-bg animate-slide-up">
        {/* En-tête */}
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-border bg-bg px-5 py-4">
          <div>
            <h2 className="font-display text-2xl font-semibold">
              {pick(lang, formule.name, formule.nameEn)}
            </h2>
            {pick(lang, formule.description, formule.descriptionEn) && (
              <p className="mt-0.5 text-sm text-muted">
                {pick(lang, formule.description, formule.descriptionEn)}
              </p>
            )}
            <p className="mt-1 font-semibold text-brand">
              {formatPrice(formule.priceCents, currency)}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface text-lg active:scale-90"
          >
            ✕
          </button>
        </div>

        {/* Étapes : un choix par étape */}
        <div className="space-y-6 p-5">
          {formule.steps.map((s, i) => (
            <div key={s.id}>
              <div className="mb-2 flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-brand/15 text-xs font-bold text-brand">
                  {i + 1}
                </span>
                <h3 className="font-semibold">{pick(lang, s.name, s.nameEn)}</h3>
              </div>
              <div className="space-y-2">
                {s.choices.map((c) => {
                  const isSel = selected[s.id] === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelected((p) => ({ ...p, [s.id]: c.id }))}
                      className={`flex w-full items-center gap-2 rounded-xl border px-4 py-3 text-left text-sm transition ${
                        isSel
                          ? "border-emerald-500 bg-emerald-500/10"
                          : "border-border bg-surface"
                      }`}
                    >
                      <span
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                          isSel
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-border"
                        }`}
                      >
                        {isSel ? "✓" : ""}
                      </span>
                      {pick(lang, c.name, c.nameEn)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {canOrder && (
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("note")}
              className="w-full rounded-xl bg-surface px-4 py-3 text-sm outline-none placeholder:text-muted focus:ring-2 focus:ring-brand"
            />
          )}
        </div>

        {/* Action */}
        <div className="sticky bottom-0 border-t border-border bg-bg p-4 pb-6">
          {canOrder ? (
            <button
              onClick={add}
              disabled={!allChosen}
              className="w-full rounded-full bg-brand px-6 py-4 font-semibold text-white transition active:scale-[0.99] disabled:opacity-50"
            >
              {t("add")} — {formatPrice(formule.priceCents, currency)}
            </button>
          ) : (
            <p className="text-center text-xl font-bold">
              {formatPrice(formule.priceCents, currency)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
