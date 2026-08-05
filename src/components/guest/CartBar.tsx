"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { useCart } from "./cart";
import { useLang } from "./lang";
import { track } from "@/lib/track";

export function CartBar({
  slug,
  restaurantId,
  tableNumber,
  currency,
  tipEnabled,
}: {
  slug: string;
  restaurantId: string;
  tableNumber: number | null;
  currency: string;
  tipEnabled: boolean;
}) {
  const cart = useCart();
  const router = useRouter();
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipPct, setTipPct] = useState(0);

  if (cart.count === 0) return null;

  const tipCents = Math.round((cart.totalCents * tipPct) / 100);
  const grandTotal = cart.totalCents + tipCents;

  async function submit() {
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          tableNumber,
          tipCents,
          items: cart.lines.map((l) => ({
            dishId: l.dishId,
            formuleId: l.formuleId,
            choiceDishIds: l.choiceDishIds,
            quantity: l.quantity,
            note: l.note,
            optionChoiceIds: l.optionChoiceIds,
          })),
        }),
      });
      if (!res.ok) throw new Error("Échec de l'envoi");
      const { orderId } = await res.json();
      track("ORDER");
      cart.clear();
      router.push(`/r/${slug}/t/${tableNumber ?? 0}/commande/${orderId}`);
    } catch {
      setError("Impossible d'envoyer la commande. Réessayez.");
      setSending(false);
    }
  }

  return (
    <>
      {/* Barre persistante en bas */}
      {!open && (
        <div className="fixed inset-x-0 bottom-0 z-30 p-3">
          <button
            onClick={() => setOpen(true)}
            className="flex w-full items-center justify-between rounded-2xl bg-brand px-5 py-4 font-semibold text-white shadow-2xl shadow-brand/30 active:scale-[0.99] transition"
          >
            <span className="flex items-center gap-2">
              <span className="grid h-6 min-w-6 place-items-center rounded-full bg-white/25 px-1.5 text-sm tabular-nums">
                {cart.count}
              </span>
              {t("viewOrder")}
            </span>
            <span className="tabular-nums">
              {formatPrice(cart.totalCents, currency)}
            </span>
          </button>
        </div>
      )}

      {/* Récapitulatif */}
      {open && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/60 animate-fade-in"
            onClick={() => setOpen(false)}
          />
          <div className="relative max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-border bg-bg animate-slide-up">
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-bg px-5 py-4">
              <h2 className="text-lg font-bold">{t("myOrder")}</h2>
              <button
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-surface text-lg active:scale-90"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            {tableNumber != null && (
              <div className="px-5 pt-3 text-sm text-muted">
                {t("table")}{" "}
                <span className="font-semibold text-text">{tableNumber}</span>
              </div>
            )}

            <ul className="divide-y divide-border px-5">
              {cart.lines.map((l) => (
                <li key={l.lineId} className="flex items-center gap-3 py-3">
                  {l.photoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={l.photoUrl}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-xl object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{l.name}</p>
                    {l.optionsText && (
                      <p className="truncate text-xs text-muted">{l.optionsText}</p>
                    )}
                    {l.note && (
                      <p className="truncate text-xs text-muted">« {l.note} »</p>
                    )}
                    <p className="text-sm text-muted">
                      {formatPrice(l.priceCents, currency)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-surface px-1.5 py-1">
                    <button
                      onClick={() => cart.setQty(l.lineId, l.quantity - 1)}
                      className="grid h-7 w-7 place-items-center rounded-full bg-surface-2 active:scale-90"
                      aria-label="Retirer un"
                    >
                      −
                    </button>
                    <span className="min-w-5 text-center text-sm font-semibold tabular-nums">
                      {l.quantity}
                    </span>
                    <button
                      onClick={() => cart.setQty(l.lineId, l.quantity + 1)}
                      className="grid h-7 w-7 place-items-center rounded-full bg-surface-2 active:scale-90"
                      aria-label="Ajouter un"
                    >
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Pourboire (si activé par le restaurateur) */}
            {tipEnabled && (
              <div className="px-5 pt-4">
                <p className="mb-2 text-sm text-muted">{t("addTip")}</p>
                <div className="flex gap-2">
                  {[0, 5, 10, 15].map((p) => (
                    <button
                      key={p}
                      onClick={() => setTipPct(p)}
                      className={`flex-1 rounded-xl border px-2 py-2 text-sm font-medium transition ${
                        tipPct === p
                          ? "border-brand bg-brand/15 text-brand"
                          : "border-border bg-surface text-muted"
                      }`}
                    >
                      {p === 0 ? t("none") : `${p}%`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1 px-5 py-4">
              {tipEnabled && tipCents > 0 && (
                <>
                  <div className="flex items-center justify-between text-sm text-muted">
                    <span>{t("subtotal")}</span>
                    <span className="tabular-nums">
                      {formatPrice(cart.totalCents, currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted">
                    <span>
                      {t("tip")} ({tipPct}%)
                    </span>
                    <span className="tabular-nums">
                      {formatPrice(tipCents, currency)}
                    </span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between text-lg font-bold">
                <span>{t("total")}</span>
                <span className="tabular-nums">
                  {formatPrice(grandTotal, currency)}
                </span>
              </div>
            </div>

            {error && <p className="px-5 pb-2 text-sm text-red-400">{error}</p>}

            <div className="sticky bottom-0 border-t border-border bg-bg p-4 pb-6">
              <button
                onClick={submit}
                disabled={sending}
                className="w-full rounded-full bg-brand px-6 py-4 font-semibold text-white active:scale-[0.99] transition disabled:opacity-60"
              >
                {sending ? t("sending") : t("order")}
              </button>
              <p className="mt-2 text-center text-xs text-muted">
                {t("sentToKitchen")}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
