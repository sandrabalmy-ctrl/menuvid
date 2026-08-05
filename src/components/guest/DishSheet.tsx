"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DishDTO } from "@/lib/menu";
import { formatPrice } from "@/lib/format";
import { allergenLabel, dietLabel } from "@/lib/labels";
import { resolveOptions, type OptionGroup } from "@/lib/options";
import { useCart } from "./cart";
import { useLang } from "./lang";
import { pick } from "@/lib/i18n";
import { track } from "@/lib/track";

export function DishSheet({
  dish,
  currency,
  canOrder,
  hasVideo,
  onClose,
}: {
  dish: DishDTO;
  currency: string;
  canOrder: boolean;
  hasVideo: boolean;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [videoOk, setVideoOk] = useState(true);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const cart = useCart();
  const { lang, t } = useLang();

  const hasOptions = dish.options.length > 0;

  // Pré-sélectionne le 1er choix des groupes obligatoires (à choix unique).
  const [selected, setSelected] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    dish.options.forEach((g) => {
      if (g.type === "single" && g.required && g.choices[0])
        init[g.id] = [g.choices[0].id];
    });
    return init;
  });

  function toggle(group: OptionGroup, choiceId: string) {
    setSelected((prev) => {
      const cur = prev[group.id] ?? [];
      if (group.type === "single") return { ...prev, [group.id]: [choiceId] };
      const has = cur.includes(choiceId);
      return {
        ...prev,
        [group.id]: has ? cur.filter((x) => x !== choiceId) : [...cur, choiceId],
      };
    });
  }

  const selectedIds = useMemo(
    () => Object.values(selected).flat(),
    [selected]
  );
  const { priceDelta, text, valid } = resolveOptions(dish.options, selectedIds);
  const unitPrice = dish.priceCents + priceDelta;

  const showVideo = hasVideo && !!dish.videoUrl && videoOk;

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  function addToCart() {
    cart.add(dish, qty, note.trim() || undefined, {
      choiceIds: selectedIds,
      priceDelta,
      text,
    });
    track("ADD_TO_CART", dish.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black animate-fade-in">
      {/* Média */}
      <div
        className={`relative overflow-hidden ${
          hasOptions ? "h-[40vh] shrink-0" : "flex-1"
        }`}
      >
        {showVideo ? (
          <video
            ref={videoRef}
            src={dish.videoUrl!}
            poster={dish.photoUrl ?? undefined}
            muted={muted}
            loop
            playsInline
            autoPlay
            onError={() => setVideoOk(false)}
            onClick={() => setMuted((m) => !m)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : dish.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dish.photoUrl}
            alt={dish.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-7xl">🍽️</div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40" />

        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-black/50 text-xl text-white backdrop-blur active:scale-90"
        >
          ✕
        </button>
        {showVideo && (
          <button
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Activer le son" : "Couper le son"}
            className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-black/50 text-lg backdrop-blur active:scale-90"
          >
            {muted ? "🔇" : "🔊"}
          </button>
        )}

        <div
          className="absolute inset-x-0 bottom-0 p-5 text-white"
          style={{ textShadow: "0 1px 6px rgba(0,0,0,0.7)" }}
        >
          <h2 className="font-display text-3xl font-semibold">
            {pick(lang, dish.name, dish.nameEn)}
          </h2>
          <p className="mt-1 text-white/75">
            {pick(lang, dish.description, dish.descriptionEn)}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {dish.diets.map((d) => (
              <span
                key={d}
                className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs text-emerald-200"
              >
                {dietLabel(d, lang).icon} {dietLabel(d, lang).label}
              </span>
            ))}
            {dish.allergens.map((a) => (
              <span
                key={a}
                className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/70"
              >
                {allergenLabel(a, lang).icon} {allergenLabel(a, lang).label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Zone options (scrollable) — uniquement si le plat a des options */}
      {hasOptions && canOrder && dish.available && (
        <div className="flex-1 space-y-5 overflow-y-auto bg-bg p-4">
          {dish.options.map((g) => (
            <div key={g.id}>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="font-semibold">{g.name}</h3>
                <span className="text-xs text-muted">
                  {g.required
                    ? lang === "en"
                      ? "required"
                      : "obligatoire"
                    : lang === "en"
                      ? "optional"
                      : "au choix"}
                </span>
              </div>
              <div className="space-y-2">
                {g.choices.map((c) => {
                  const isSel = (selected[g.id] ?? []).includes(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggle(g, c.id)}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                        isSel
                          ? "border-brand bg-brand/10"
                          : "border-border bg-surface"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`grid h-5 w-5 place-items-center ${
                            g.type === "single" ? "rounded-full" : "rounded-md"
                          } border ${isSel ? "border-brand bg-brand text-white" : "border-border"}`}
                        >
                          {isSel ? "✓" : ""}
                        </span>
                        {c.label}
                      </span>
                      {c.priceCents > 0 && (
                        <span className="text-muted">
                          +{formatPrice(c.priceCents, currency)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("note")}
            className="w-full rounded-xl bg-surface px-4 py-3 text-sm outline-none placeholder:text-muted focus:ring-2 focus:ring-brand"
          />
        </div>
      )}

      {/* Barre d'action */}
      {canOrder && dish.available ? (
        <div className="shrink-0 border-t border-border bg-bg p-4 pb-6">
          {!hasOptions && (
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("note")}
              className="mb-3 w-full rounded-xl bg-surface px-4 py-3 text-sm outline-none placeholder:text-muted focus:ring-2 focus:ring-brand"
            />
          )}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 rounded-full bg-surface px-2 py-1.5">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Retirer un"
                className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-lg active:scale-90"
              >
                −
              </button>
              <span className="min-w-6 text-center font-semibold tabular-nums">
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => q + 1)}
                aria-label="Ajouter un"
                className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-lg active:scale-90"
              >
                +
              </button>
            </div>
            <button
              onClick={addToCart}
              disabled={!valid}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
            >
              {t("add")} — {formatPrice(unitPrice * qty, currency)}
            </button>
          </div>
        </div>
      ) : (
        <div className="shrink-0 border-t border-border bg-bg p-4 pb-6 text-center">
          {!dish.available ? (
            <span className="text-muted">{t("unavailableNow")}</span>
          ) : (
            <span className="text-xl font-bold">
              {formatPrice(dish.priceCents, currency)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
