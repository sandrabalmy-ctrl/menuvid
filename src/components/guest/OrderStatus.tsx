"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { useLang } from "./lang";
import type { StringKey } from "@/lib/i18n";

type SessionData = {
  id: string;
  tableNumber: number | null;
  subtotalCents: number;
  tipCents: number;
  totalCents: number;
  paidCents: number;
  remainingCents: number;
  orderCount: number;
  settled: boolean;
};

type OrderData = {
  id: string;
  status: string;
  totalCents: number;
  tipCents?: number;
  paid?: boolean;
  etaMinutes?: number | null;
  createdAt?: string;
  session?: SessionData | null;
  tableNumber: number | null;
  items: {
    name: string;
    quantity: number;
    unitPriceCents: number;
    optionsText?: string | null;
    note?: string | null;
  }[];
};

const STEPS: { key: string; labelKey: StringKey; icon: string }[] = [
  { key: "RECEIVED", labelKey: "stReceived", icon: "📥" },
  { key: "PREPARING", labelKey: "stPreparing", icon: "👨‍🍳" },
  { key: "READY", labelKey: "stReady", icon: "🔔" },
  { key: "SERVED", labelKey: "stServed", icon: "✅" },
];

export function OrderStatus({
  orderId,
  slug,
  currency,
  onlinePaymentEnabled,
}: {
  orderId: string;
  slug: string;
  currency: string;
  onlinePaymentEnabled: boolean;
}) {
  const { t, lang } = useLang();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [paying, setPaying] = useState(false);

  async function refetch() {
    const r = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
    if (r.ok) setOrder(await r.json());
  }

  // Paie l'addition de la table : tout, ou une part (diviser en N).
  async function paySession(sessionId: string, mode: "full" | "share", parts?: number) {
    setPaying(true);
    try {
      const res = await fetch("/api/session/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, mode, parts }),
      });
      const j = await res.json().catch(() => ({}));
      if (j.url) {
        window.location.href = j.url;
        return;
      }
      await refetch();
    } catch {}
    setPaying(false);
  }

  useEffect(() => {
    let alive = true;
    async function poll() {
      try {
        const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
        if (res.status === 404) {
          if (alive) setNotFound(true);
          return;
        }
        const data = await res.json();
        if (alive) setOrder(data);
      } catch {}
    }
    poll();
    // Interroge le serveur toutes les 4 secondes pour suivre le statut en direct.
    const timer = setInterval(poll, 4000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [orderId]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <p className="text-muted">Commande introuvable.</p>
        <Link href={`/r/${slug}/t/0`} className="mt-4 inline-block text-brand">
          Retour au menu
        </Link>
      </div>
    );
  }

  const currentIndex = order
    ? STEPS.findIndex((s) => s.key === order.status)
    : 0;
  const cancelled = order?.status === "CANCELLED";

  // Temps d'attente restant : ETA figée à la commande − temps écoulé.
  let etaRemaining: number | null = null;
  if (order?.etaMinutes != null && order.createdAt && currentIndex < 2) {
    const elapsedMin = Math.floor(
      (Date.now() - new Date(order.createdAt).getTime()) / 60000
    );
    etaRemaining = Math.max(0, order.etaMinutes - elapsedMin);
  }

  return (
    <div className="mx-auto min-h-full max-w-md p-5">
      <div className="rounded-3xl bg-surface p-6 text-center">
        <div className="text-5xl">
          {cancelled ? "❌" : STEPS[Math.max(0, currentIndex)]?.icon ?? "📥"}
        </div>
        <h1 className="mt-3 text-2xl font-bold">
          {cancelled
            ? t("cancelled")
            : currentIndex >= 2
              ? t("ready")
              : t("orderSent")}
        </h1>
        {order?.tableNumber != null && (
          <p className="mt-1 text-muted">
            {t("table")} {order.tableNumber}
          </p>
        )}
      </div>

      {/* Temps d'attente estimé */}
      {!cancelled && etaRemaining != null && (
        <div className="mt-4 rounded-2xl bg-brand/10 px-4 py-3 text-center">
          <p className="text-sm text-muted">
            {lang === "en" ? "Estimated wait" : "Temps d’attente estimé"}
          </p>
          <p className="text-2xl font-bold text-brand">
            {etaRemaining > 0
              ? `~${etaRemaining} min`
              : lang === "en"
                ? "Any moment now"
                : "d’un instant à l’autre"}
          </p>
        </div>
      )}

      {/* Frise de progression */}
      {!cancelled && (
        <div className="mt-6 flex items-center justify-between px-2">
          {STEPS.map((s, i) => {
            const done = i <= currentIndex;
            return (
              <div key={s.key} className="flex flex-1 flex-col items-center">
                <div className="flex w-full items-center">
                  <div
                    className={`h-1 flex-1 ${i === 0 ? "opacity-0" : done ? "bg-brand" : "bg-border"}`}
                  />
                  <div
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg transition ${
                      done ? "bg-brand text-white" : "bg-surface text-muted"
                    }`}
                  >
                    {s.icon}
                  </div>
                  <div
                    className={`h-1 flex-1 ${i === STEPS.length - 1 ? "opacity-0" : i < currentIndex ? "bg-brand" : "bg-border"}`}
                  />
                </div>
                <span
                  className={`mt-2 text-center text-[11px] ${done ? "text-text" : "text-muted"}`}
                >
                  {t(s.labelKey)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Détail */}
      {order && (
        <div className="mt-6 rounded-3xl bg-surface p-5">
          <h2 className="mb-3 font-semibold">{t("yourOrder")}</h2>
          <ul className="divide-y divide-border">
            {order.items.map((it, idx) => (
              <li key={idx} className="flex justify-between gap-3 py-2.5 text-sm">
                <span>
                  <span className="font-medium">{it.quantity}×</span> {it.name}
                  {it.optionsText && (
                    <span className="block text-xs text-muted">{it.optionsText}</span>
                  )}
                  {it.note && (
                    <span className="block text-xs text-muted">« {it.note} »</span>
                  )}
                </span>
                <span className="tabular-nums text-muted">
                  {formatPrice(it.unitPriceCents * it.quantity, currency)}
                </span>
              </li>
            ))}
          </ul>
          {order.tipCents ? (
            <div className="mt-3 space-y-1 border-t border-border pt-3">
              <div className="flex justify-between text-sm text-muted">
                <span>{t("subtotal")}</span>
                <span className="tabular-nums">
                  {formatPrice(order.totalCents, currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-muted">
                <span>{t("tip")}</span>
                <span className="tabular-nums">
                  {formatPrice(order.tipCents, currency)}
                </span>
              </div>
              <div className="flex justify-between font-bold">
                <span>{t("total")}</span>
                <span className="tabular-nums">
                  {formatPrice(order.totalCents + order.tipCents, currency)}
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex justify-between border-t border-border pt-3 font-bold">
              <span>{t("total")}</span>
              <span className="tabular-nums">
                {formatPrice(order.totalCents, currency)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Addition de la table (toutes les tournées) */}
      {order?.session && (
        <div className="mt-6 rounded-3xl bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">
              {lang === "en" ? "Table bill" : "Addition de la table"}
            </h2>
            <span className="text-xs text-muted">
              {order.session.orderCount}{" "}
              {lang === "en"
                ? order.session.orderCount > 1
                  ? "orders"
                  : "order"
                : order.session.orderCount > 1
                  ? "tournées"
                  : "tournée"}
            </span>
          </div>

          <div className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between text-muted">
              <span>{t("subtotal")}</span>
              <span className="tabular-nums">
                {formatPrice(order.session.subtotalCents, currency)}
              </span>
            </div>
            {order.session.tipCents > 0 && (
              <div className="flex justify-between text-muted">
                <span>{t("tip")}</span>
                <span className="tabular-nums">
                  {formatPrice(order.session.tipCents, currency)}
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold">
              <span>{t("total")}</span>
              <span className="tabular-nums">
                {formatPrice(order.session.totalCents, currency)}
              </span>
            </div>
            {order.session.paidCents > 0 && !order.session.settled && (
              <div className="flex justify-between text-emerald-600">
                <span>{lang === "en" ? "Remaining" : "Reste à payer"}</span>
                <span className="tabular-nums">
                  {formatPrice(order.session.remainingCents, currency)}
                </span>
              </div>
            )}
          </div>

          {order.session.settled ? (
            <p className="mt-4 rounded-2xl bg-emerald-500/15 px-4 py-3 text-center font-semibold text-emerald-700">
              ✅{" "}
              {lang === "en"
                ? "Bill settled — thank you!"
                : "Addition réglée — merci !"}
            </p>
          ) : (
            onlinePaymentEnabled && (
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => paySession(order.session!.id, "full")}
                  disabled={paying}
                  className="w-full rounded-full bg-brand px-6 py-3.5 font-semibold text-white transition active:scale-[0.99] disabled:opacity-60"
                >
                  {paying
                    ? "…"
                    : `💳 ${lang === "en" ? "Pay the bill" : "Payer l'addition"} — ${formatPrice(
                        order.session.remainingCents,
                        currency
                      )}`}
                </button>
                <div className="flex items-center gap-2">
                  <span className="shrink-0 text-xs text-muted">
                    {lang === "en" ? "Split:" : "Diviser :"}
                  </span>
                  {[2, 3, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => paySession(order.session!.id, "share", n)}
                      disabled={paying}
                      className="flex-1 rounded-xl border border-border bg-surface px-2 py-2 text-sm disabled:opacity-60"
                    >
                      ÷{n}
                    </button>
                  ))}
                </div>
                <p className="text-center text-[11px] text-muted">
                  {lang === "en"
                    ? "Pay your share (1/N of the total)."
                    : "Payez votre part (1/N du total)."}
                </p>
              </div>
            )
          )}
        </div>
      )}

      <Link
        href={`/r/${slug}/t/${order?.tableNumber ?? 0}`}
        className="mt-6 block rounded-full bg-brand/10 py-3.5 text-center font-semibold text-brand"
      >
        🍽️ {lang === "en" ? "Order something else" : "Commander autre chose"}
      </Link>
      <Link
        href={`/r/${slug}/t/${order?.tableNumber ?? 0}`}
        className="mt-2 block text-center text-sm text-muted"
      >
        ← {t("backToMenu")}
      </Link>
    </div>
  );
}
