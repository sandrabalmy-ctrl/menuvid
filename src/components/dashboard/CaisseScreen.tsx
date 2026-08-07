"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/lib/format";

type Dish = { id: string; name: string; priceCents: number };
type Category = { id: string; name: string; dishes: Dish[] };
type Line = { dishId: string; name: string; priceCents: number; qty: number };

type ReceiptItem = { name: string; quantity: number; unitPriceCents: number };
type Receipt = {
  subtotalCents: number;
  discountCents: number;
  tipCents: number;
  totalCents: number;
  dueCents: number;
  paymentMethod: string;
  amountReceivedCents: number;
  changeCents: number;
  items: ReceiptItem[];
  tableNumber?: number | null;
  at: string;
};

type OpenOrder = {
  id: string;
  totalCents: number;
  tableNumber: number | null;
  tableLabel: string | null;
  createdAt: string;
  items: { name: string; quantity: number; unitPriceCents: number }[];
};

type Today = {
  count: number;
  counterCount: number;
  totalCents: number;
  cashCents: number;
  cardCents: number;
  onlineCents: number;
  tipsCents: number;
  discountCents: number;
};

// Ce que le PayModal renvoie au serveur (sale ou pay/[id]).
type PayPayload = {
  paymentMethod: "CASH" | "CARD";
  amountReceivedCents: number;
  tipCents: number;
  discountPct: number;
};

export function CaisseScreen({
  currency,
  restaurantName,
  categories,
}: {
  currency: string;
  restaurantName: string;
  categories: Category[];
}) {
  const [mode, setMode] = useState<"COUNTER" | "TABLES">("COUNTER");
  const [activeCat, setActiveCat] = useState(categories[0]?.id ?? "");
  const [lines, setLines] = useState<Line[]>([]);
  const [pay, setPay] = useState<{
    subtotalCents: number;
    submit: (p: PayPayload) => Promise<Receipt | null>;
  } | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [cloture, setCloture] = useState<Today | null>(null);
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);

  const total = useMemo(
    () => lines.reduce((s, l) => s + l.priceCents * l.qty, 0),
    [lines]
  );

  const loadOpen = useCallback(async () => {
    const r = await fetch("/api/caisse/open-orders", { cache: "no-store" });
    if (r.ok) setOpenOrders((await r.json()).orders ?? []);
  }, []);

  // Sonde en continu les commandes de table restant à encaisser (badge).
  useEffect(() => {
    loadOpen();
    const t = setInterval(loadOpen, 10000);
    return () => clearInterval(t);
  }, [loadOpen]);

  function add(d: Dish) {
    setLines((prev) => {
      const ex = prev.find((l) => l.dishId === d.id);
      if (ex)
        return prev.map((l) =>
          l.dishId === d.id ? { ...l, qty: l.qty + 1 } : l
        );
      return [...prev, { dishId: d.id, name: d.name, priceCents: d.priceCents, qty: 1 }];
    });
  }
  function setQty(dishId: string, qty: number) {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.dishId !== dishId)
        : prev.map((l) => (l.dishId === dishId ? { ...l, qty } : l))
    );
  }

  // Encaissement d'un ticket comptoir → /api/caisse/sale
  function payCounter() {
    setPay({
      subtotalCents: total,
      submit: async (p) => {
        const res = await fetch("/api/caisse/sale", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: lines.map((l) => ({ dishId: l.dishId, quantity: l.qty })),
            ...p,
          }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) return null;
        setLines([]);
        return {
          ...j,
          items: lines.map((l) => ({
            name: l.name,
            quantity: l.qty,
            unitPriceCents: l.priceCents,
          })),
          at: j.createdAt,
        };
      },
    });
  }

  // Encaissement d'une commande de table existante → /api/caisse/pay/[id]
  function payOrder(o: OpenOrder) {
    setPay({
      subtotalCents: o.totalCents,
      submit: async (p) => {
        const res = await fetch(`/api/caisse/pay/${o.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(p),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) return null;
        loadOpen();
        return { ...j, items: j.items, at: j.createdAt };
      },
    });
  }

  const cat = categories.find((c) => c.id === activeCat);

  return (
    <div className="space-y-4">
      {/* En-tête : bascule comptoir / tables + clôture */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Caisse</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full bg-surface p-1">
            <button
              onClick={() => setMode("COUNTER")}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                mode === "COUNTER" ? "bg-brand text-white" : "text-muted"
              }`}
            >
              🧾 Comptoir
            </button>
            <button
              onClick={() => setMode("TABLES")}
              className={`relative rounded-full px-4 py-1.5 text-sm font-semibold ${
                mode === "TABLES" ? "bg-brand text-white" : "text-muted"
              }`}
            >
              🍽️ Tables
              {openOrders.length > 0 && (
                <span className="ml-1.5 inline-grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                  {openOrders.length}
                </span>
              )}
            </button>
          </div>
          <button
            onClick={async () => {
              const r = await fetch("/api/caisse/today", { cache: "no-store" });
              if (r.ok) setCloture(await r.json());
            }}
            className="rounded-xl bg-surface px-4 py-2 text-sm font-semibold"
          >
            📊 Clôture
          </button>
        </div>
      </div>

      {mode === "COUNTER" ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          {/* Catalogue */}
          <div className="space-y-3">
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(c.id)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
                    activeCat === c.id ? "bg-brand text-white" : "bg-surface text-muted"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {cat?.dishes.map((d) => (
                <button
                  key={d.id}
                  onClick={() => add(d)}
                  className="flex flex-col justify-between rounded-2xl bg-surface p-3 text-left transition active:scale-95"
                >
                  <span className="text-sm font-medium leading-tight">{d.name}</span>
                  <span className="mt-2 text-sm font-bold text-brand">
                    {formatPrice(d.priceCents, currency)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Ticket en cours */}
          <div className="flex h-fit flex-col rounded-2xl border border-border bg-surface/50 p-4 lg:sticky lg:top-4">
            <h2 className="mb-2 font-semibold">Ticket</h2>
            {lines.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">
                Touchez un article pour l’ajouter.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {lines.map((l) => (
                  <li key={l.dishId} className="flex items-center gap-2 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{l.name}</p>
                      <p className="text-xs text-muted">
                        {formatPrice(l.priceCents, currency)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setQty(l.dishId, l.qty - 1)}
                        className="grid h-7 w-7 place-items-center rounded-full bg-surface-2"
                      >
                        −
                      </button>
                      <span className="min-w-5 text-center text-sm font-semibold tabular-nums">
                        {l.qty}
                      </span>
                      <button
                        onClick={() => setQty(l.dishId, l.qty + 1)}
                        className="grid h-7 w-7 place-items-center rounded-full bg-surface-2"
                      >
                        +
                      </button>
                    </div>
                    <span className="w-16 text-right text-sm font-semibold tabular-nums">
                      {formatPrice(l.priceCents * l.qty, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-lg font-bold">
              <span>Total</span>
              <span className="tabular-nums">{formatPrice(total, currency)}</span>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setLines([])}
                disabled={lines.length === 0}
                className="rounded-xl bg-surface px-4 py-3 text-sm font-medium text-muted disabled:opacity-40"
              >
                Vider
              </button>
              <button
                onClick={payCounter}
                disabled={lines.length === 0}
                className="flex-1 rounded-xl bg-brand px-4 py-3 font-semibold text-white disabled:opacity-40"
              >
                Encaisser — {formatPrice(total, currency)}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Commandes de table à encaisser */
        <div>
          {openOrders.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted">
              Aucune commande de table à encaisser.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {openOrders.map((o) => (
                <button
                  key={o.id}
                  onClick={() => payOrder(o)}
                  className="flex flex-col rounded-2xl border border-border bg-surface/50 p-4 text-left transition hover:border-brand active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      {o.tableNumber != null
                        ? `Table ${o.tableNumber}`
                        : o.tableLabel ?? "Commande"}
                    </span>
                    <span className="text-lg font-bold text-brand tabular-nums">
                      {formatPrice(o.totalCents, currency)}
                    </span>
                  </div>
                  <ul className="mt-2 space-y-0.5 text-sm text-muted">
                    {o.items.map((it, i) => (
                      <li key={i} className="truncate">
                        {it.quantity}× {it.name}
                      </li>
                    ))}
                  </ul>
                  <span className="mt-3 rounded-lg bg-brand/10 px-3 py-1.5 text-center text-sm font-semibold text-brand">
                    Encaisser
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {pay && (
        <PayModal
          subtotalCents={pay.subtotalCents}
          currency={currency}
          onClose={() => setPay(null)}
          onSubmit={pay.submit}
          onDone={(r) => {
            setReceipt(r);
            setPay(null);
          }}
        />
      )}

      {receipt && (
        <ReceiptModal
          receipt={receipt}
          currency={currency}
          restaurantName={restaurantName}
          onClose={() => setReceipt(null)}
        />
      )}

      {cloture && (
        <ClotureModal
          data={cloture}
          currency={currency}
          restaurantName={restaurantName}
          onClose={() => setCloture(null)}
        />
      )}
    </div>
  );
}

function PayModal({
  subtotalCents,
  currency,
  onClose,
  onSubmit,
  onDone,
}: {
  subtotalCents: number;
  currency: string;
  onClose: () => void;
  onSubmit: (p: PayPayload) => Promise<Receipt | null>;
  onDone: (r: Receipt) => void;
}) {
  const [method, setMethod] = useState<"CASH" | "CARD">("CASH");
  const [received, setReceived] = useState("");
  const [discountPct, setDiscountPct] = useState(0);
  const [tip, setTip] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const toCents = (s: string) =>
    Math.max(0, Math.round(parseFloat(s.replace(",", ".")) * 100) || 0);

  const discountCents = Math.round((subtotalCents * discountPct) / 100);
  const afterDiscount = subtotalCents - discountCents;
  const tipCents = toCents(tip);
  const due = afterDiscount + tipCents;
  const receivedCents = toCents(received);
  const change = method === "CASH" && receivedCents > due ? receivedCents - due : 0;

  async function validate() {
    setBusy(true);
    setErr("");
    const r = await onSubmit({
      paymentMethod: method,
      amountReceivedCents: receivedCents,
      tipCents,
      discountPct,
    });
    setBusy(false);
    if (r) onDone(r);
    else setErr("L’encaissement a échoué. Réessayez.");
  }

  return (
    <Overlay onClose={onClose}>
      <h3 className="text-lg font-bold">Encaissement</h3>

      {/* Détail du montant */}
      <div className="mt-3 space-y-1 rounded-xl bg-surface p-3 text-sm">
        <div className="flex justify-between text-muted">
          <span>Sous-total</span>
          <span className="tabular-nums">{formatPrice(subtotalCents, currency)}</span>
        </div>
        {discountCents > 0 && (
          <div className="flex justify-between text-emerald-500">
            <span>Remise {discountPct}%</span>
            <span className="tabular-nums">−{formatPrice(discountCents, currency)}</span>
          </div>
        )}
        {tipCents > 0 && (
          <div className="flex justify-between text-muted">
            <span>Pourboire</span>
            <span className="tabular-nums">+{formatPrice(tipCents, currency)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-border pt-1 text-base font-bold">
          <span>À payer</span>
          <span className="tabular-nums text-brand">{formatPrice(due, currency)}</span>
        </div>
      </div>

      {/* Remise en % */}
      <div className="mt-4">
        <label className="text-sm text-muted">Remise</label>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {[0, 5, 10, 15, 20].map((p) => (
            <button
              key={p}
              onClick={() => setDiscountPct(p)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                discountPct === p
                  ? "bg-brand text-white"
                  : "bg-surface text-muted"
              }`}
            >
              {p === 0 ? "Aucune" : `${p}%`}
            </button>
          ))}
        </div>
      </div>

      {/* Pourboire (montant libre) */}
      <div className="mt-4">
        <label className="text-sm text-muted">Pourboire (facultatif)</label>
        <input
          value={tip}
          onChange={(e) => setTip(e.target.value)}
          inputMode="decimal"
          placeholder="0"
          className="mt-1 w-full rounded-xl bg-surface px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      {/* Mode de paiement */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {(["CASH", "CARD"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMethod(m)}
            className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
              method === m
                ? "border-brand bg-brand/15 text-brand"
                : "border-border bg-surface text-muted"
            }`}
          >
            {m === "CASH" ? "💵 Espèces" : "💳 Carte"}
          </button>
        ))}
      </div>

      {method === "CASH" && (
        <div className="mt-4">
          <label className="text-sm text-muted">Montant reçu</label>
          <input
            value={received}
            onChange={(e) => setReceived(e.target.value)}
            inputMode="decimal"
            placeholder="0"
            className="mt-1 w-full rounded-xl bg-surface px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-brand"
          />
          {change > 0 && (
            <p className="mt-2 text-sm">
              Rendu :{" "}
              <span className="font-bold text-emerald-500">
                {formatPrice(change, currency)}
              </span>
            </p>
          )}
        </div>
      )}

      {err && <p className="mt-3 text-sm text-red-500">{err}</p>}

      <button
        onClick={validate}
        disabled={busy}
        className="mt-5 w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {busy ? "…" : `Valider — ${formatPrice(due, currency)}`}
      </button>
    </Overlay>
  );
}

function ReceiptModal({
  receipt,
  currency,
  restaurantName,
  onClose,
}: {
  receipt: Receipt;
  currency: string;
  restaurantName: string;
  onClose: () => void;
}) {
  return (
    <Overlay onClose={onClose}>
      <div id="ticket" className="text-center">
        <p className="font-display text-lg font-semibold">{restaurantName}</p>
        <p className="text-xs text-muted">
          Ticket de caisse
          {receipt.tableNumber != null && ` · Table ${receipt.tableNumber}`}
        </p>
        <div className="my-3 border-y border-dashed border-border py-3 text-left">
          {receipt.items.map((it, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>
                {it.quantity}× {it.name}
              </span>
              <span className="tabular-nums">
                {formatPrice(it.unitPriceCents * it.quantity, currency)}
              </span>
            </div>
          ))}
        </div>
        {(receipt.discountCents > 0 || receipt.tipCents > 0) && (
          <div className="mb-2 space-y-0.5 text-sm text-muted">
            {receipt.discountCents > 0 && (
              <div className="flex justify-between">
                <span>Remise</span>
                <span className="tabular-nums">
                  −{formatPrice(receipt.discountCents, currency)}
                </span>
              </div>
            )}
            {receipt.tipCents > 0 && (
              <div className="flex justify-between">
                <span>Pourboire</span>
                <span className="tabular-nums">
                  +{formatPrice(receipt.tipCents, currency)}
                </span>
              </div>
            )}
          </div>
        )}
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span className="tabular-nums">{formatPrice(receipt.dueCents, currency)}</span>
        </div>
        <p className="mt-1 text-sm text-muted">
          {receipt.paymentMethod === "CASH" ? "Espèces" : "Carte"}
          {receipt.changeCents > 0 &&
            ` · Rendu ${formatPrice(receipt.changeCents, currency)}`}
        </p>
      </div>
      <div className="mt-5 flex gap-2 print:hidden">
        <button
          onClick={() => window.print()}
          className="flex-1 rounded-xl bg-surface px-4 py-3 text-sm font-semibold"
        >
          🖨️ Imprimer
        </button>
        <button
          onClick={onClose}
          className="flex-1 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white"
        >
          Terminer
        </button>
      </div>
    </Overlay>
  );
}

function ClotureModal({
  data,
  currency,
  restaurantName,
  onClose,
}: {
  data: Today;
  currency: string;
  restaurantName: string;
  onClose: () => void;
}) {
  const row = (label: string, cents: number, strong = false) => (
    <div
      className={`flex justify-between py-1.5 ${strong ? "text-lg font-bold" : "text-sm"}`}
    >
      <span>{label}</span>
      <span className="tabular-nums">{formatPrice(cents, currency)}</span>
    </div>
  );
  return (
    <Overlay onClose={onClose}>
      <p className="text-center font-display text-lg font-semibold">
        {restaurantName}
      </p>
      <p className="mb-3 text-center text-xs text-muted">
        Clôture du jour · {data.count} vente{data.count > 1 ? "s" : ""}
      </p>
      <div className="border-y border-dashed border-border py-2">
        {row("💵 Espèces", data.cashCents)}
        {row("💳 Carte", data.cardCents)}
        {row("🌐 En ligne / QR", data.onlineCents)}
      </div>
      {(data.tipsCents > 0 || data.discountCents > 0) && (
        <div className="border-b border-dashed border-border py-2 text-muted">
          {data.tipsCents > 0 && row("Dont pourboires", data.tipsCents)}
          {data.discountCents > 0 && row("Remises accordées", data.discountCents)}
        </div>
      )}
      <div className="pt-2">{row("Total encaissé", data.totalCents, true)}</div>
      <button
        onClick={onClose}
        className="mt-5 w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white"
      >
        Fermer
      </button>
    </Overlay>
  );
}

function Overlay({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-3xl border border-border bg-bg p-6">
        {children}
      </div>
    </div>
  );
}
