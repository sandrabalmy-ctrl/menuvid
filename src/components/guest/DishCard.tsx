"use client";

import { useEffect, useRef, useState } from "react";
import type { DishDTO } from "@/lib/menu";
import { formatPrice } from "@/lib/format";
import { allergenLabel, dietLabel, badgeLabel } from "@/lib/labels";
import { useCart } from "./cart";
import { useLang } from "./lang";
import { pick } from "@/lib/i18n";
import { track } from "@/lib/track";

export function DishCard({
  dish,
  currency,
  canOrder,
  hasVideo,
  onOpen,
}: {
  dish: DishDTO;
  currency: string;
  canOrder: boolean;
  hasVideo: boolean;
  onOpen: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [videoOk, setVideoOk] = useState(true);
  const viewedRef = useRef(false);
  const cart = useCart();
  const { lang, t } = useLang();
  const qty = cart.qtyOf(dish.id);

  const showVideo = hasVideo && !!dish.videoUrl && videoOk;

  // Lecture automatique (muette) dès que la carte apparaît à l'écran ;
  // pause quand elle en sort (économie batterie + data). Marche desktop ET mobile.
  useEffect(() => {
    const el = cardRef.current;
    const video = videoRef.current;
    if (!el || !video || !showVideo) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.35) {
          video.play().catch(() => {});
          if (!viewedRef.current) {
            viewedRef.current = true;
            track("VIDEO_VIEW", dish.id); // analytics : vue vidéo
          }
        } else {
          video.pause();
        }
      },
      { threshold: [0, 0.35, 0.6, 1] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [dish.id, showVideo]);

  // Bonus souris : relance la vidéo au survol (si en pause).
  function onEnter() {
    if (showVideo) videoRef.current?.play().catch(() => {});
  }

  return (
    <div
      ref={cardRef}
      onClick={onOpen}
      onMouseEnter={onEnter}
      className="group relative w-full cursor-pointer select-none overflow-hidden rounded-[28px] bg-surface shadow-2xl shadow-black/40 ring-1 ring-brand/15 transition duration-300 hover:ring-brand/40 active:scale-[0.985] aspect-[4/5]"
    >
      {/* Média : vidéo (si dispo) sinon photo */}
      {showVideo ? (
        <video
          ref={videoRef}
          src={dish.videoUrl!}
          poster={dish.photoUrl ?? undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onError={() => setVideoOk(false)}
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
        <div className="absolute inset-0 grid place-items-center text-5xl">🍽️</div>
      )}

      {/* Dégradé pour lisibilité du texte (renforcé en bas) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 via-35% to-transparent" />

      {/* Badge "vidéo" en haut */}
      {showVideo && (
        <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md ring-1 ring-white/15">
          <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-white/90 text-[8px] text-black">
            ▶
          </span>
          {t("video")}
        </span>
      )}

      {/* Badge mise en avant (populaire / coup de cœur) */}
      {dish.badge && badgeLabel(dish.badge, lang) && (
        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-black shadow-lg">
          {badgeLabel(dish.badge, lang)!.icon} {badgeLabel(dish.badge, lang)!.label}
        </span>
      )}

      {/* Indisponible (rupture) */}
      {!dish.available && (
        <div className="absolute inset-0 grid place-items-center bg-black/60">
          <span className="rounded-full bg-black/70 px-4 py-1.5 text-sm font-semibold">
            {t("unavailable")}
          </span>
        </div>
      )}

      {/* Infos + action en bas — texte toujours blanc (sur média), quel que soit le thème */}
      <div
        className="absolute inset-x-0 bottom-0 p-4 text-white"
        style={{ textShadow: "0 1px 6px rgba(0,0,0,0.7)" }}
      >
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display truncate text-[22px] font-semibold leading-tight tracking-wide">
              {pick(lang, dish.name, dish.nameEn)}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-white/65">
              {pick(lang, dish.description, dish.descriptionEn)}
            </p>
            {/* Badges régimes / allergènes */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {dish.diets.map((d) => (
                <span
                  key={d}
                  className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] text-emerald-200"
                >
                  {dietLabel(d, lang).icon} {dietLabel(d, lang).label}
                </span>
              ))}
              {dish.allergens.map((a) => (
                <span
                  key={a}
                  className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/70"
                >
                  {allergenLabel(a, lang).icon} {allergenLabel(a, lang).label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="rounded-full bg-black/45 px-4 py-1.5 text-[15px] font-semibold tracking-wide text-white backdrop-blur-md ring-1 ring-brand/30">
            {formatPrice(dish.priceCents, currency)}
          </span>
          {canOrder &&
            dish.available &&
            (dish.options.length > 0 ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen();
                }}
                className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg active:scale-95 transition"
              >
                {lang === "en" ? "Choose" : "Choisir"}
              </button>
            ) : (
              <QuickAdd
                addLabel={t("add")}
                qty={qty}
                onAdd={(e) => {
                  e.stopPropagation();
                  cart.add(dish);
                  track("ADD_TO_CART", dish.id);
                }}
                onInc={(e) => {
                  e.stopPropagation();
                  cart.setQty(dish.id, qty + 1);
                }}
                onDec={(e) => {
                  e.stopPropagation();
                  cart.setQty(dish.id, qty - 1);
                }}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

function QuickAdd({
  qty,
  addLabel,
  onAdd,
  onInc,
  onDec,
}: {
  qty: number;
  addLabel: string;
  onAdd: (e: React.MouseEvent) => void;
  onInc: (e: React.MouseEvent) => void;
  onDec: (e: React.MouseEvent) => void;
}) {
  if (qty === 0) {
    return (
      <button
        onClick={onAdd}
        aria-label="Ajouter au panier"
        className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg active:scale-95 transition"
      >
        + {addLabel}
      </button>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-full bg-brand px-2 py-1.5 text-white shadow-lg">
      <button
        onClick={onDec}
        aria-label="Retirer un"
        className="grid h-8 w-8 place-items-center rounded-full bg-white/20 text-lg active:scale-90"
      >
        −
      </button>
      <span className="min-w-5 text-center font-semibold tabular-nums">{qty}</span>
      <button
        onClick={onInc}
        aria-label="Ajouter un"
        className="grid h-8 w-8 place-items-center rounded-full bg-white/20 text-lg active:scale-90"
      >
        +
      </button>
    </div>
  );
}
