"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/lib/format";
import { formatVatRate } from "@/lib/vat";

type Dish = { id: string; name: string; priceCents: number };
type Category = { id: string; name: string; dishes: Dish[] };
type Line = { dishId: string; name: string; priceCents: number; qty: number };

type VatBucket = { permille: number; ttcCents: number; vatCents: number; htCents: number };
type ReceiptItem = { name: string; quantity: number; unitPriceCents: number };
type Receipt = {
  subtotalCents: number;
  discountCents: number;
  tipCents: number;
  totalCents: number;
  dueCents: number;
  vat: VatBucket[];
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

type Sale = {
  id: string;
  totalCents: number;
  tipCents: number;
  paymentMethod: string | null;
  source: string;
  tableNumber: number | null;
  paidAt: string;
  refunded: boolean;
  refundedByEmail: string | null;
  items: { name: string; quantity: number }[];
};

type Today = {
  count: number;
  counterCount: number;
  totalCents: number;
  cashCents: number;
  cardCents: number;
  mobileCents: number;
  onlineCents: number;
  tipsCents: number;
  discountCents: number;
  vat: VatBucket[];
  refundedCount: number;
  refundedCents: number;
};

type CashSess = {
  id: string;
  openingCents: number;
  openedAt: string;
  cashSalesCents: number;
  expectedCents: number;
} | null;

type PayMethod = "CASH" | "CARD" | "MOBILE";
type PayPayload = {
  paymentMethod: PayMethod;
  amountReceivedCents: number;
  tipCents: number;
  discountPct: number;
};

export function CaisseScreen({
  currency,
  restaurantName,
  vatPermille,
  isOwner,
  categories,
}: {
  currency: string;
  restaurantName: string;
  vatPermille: number;
  isOwner: boolean;
  categories: Category[];
}) {
  const [mode, setMode] = useState<"COUNTER" | "TABLES" | "HISTORY">("COUNTER");
  const [activeCat, setActiveCat] = useState(categories[0]?.id ?? "");
  const [lines, setLines] = useState<Line[]>([]);
  const [pay, setPay] = useState<{
    subtotalCents: number;
    submit: (p: PayPayload) => Promise<Receipt | null>;
  } | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [cloture, setCloture] = useState<Today | null>(null);
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cashOpen, setCashOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [vatRate, setVatRate] = useState(vatPermille);

  const total = useMemo(
    () => lines.reduce((s, l) => s + l.priceCents * l.qty, 0),
    [lines]
  );

  const loadOpen = useCallback(async () => {
    const r = await fetch("/api/caisse/open-orders", { cache: "no-store" });
    if (r.ok) setOpenOrders((await r.json()).orders ?? []);
  }, []);
  const loadSales = useCallback(async () => {
    const r = await fetch("/api/caisse/sales", { cache: "no-store" });
    if (r.ok) setSales((await r.json()).sales ?? []);
  }, []);

  useEffect(() => {
    loadOpen();
    const t = setInterval(loadOpen, 10000);
    return () => clearInterval(t);
  }, [loadOpen]);

  useEffect(() => {
    if (mode === "HISTORY") loadSales();
  }, [mode, loadSales]);

  function add(d: Dish) {
    setLines((prev) => {
      const ex = prev.find((l) => l.dishId === d.id);
      if (ex)
        return prev.map((l) => (l.dishId === d.id ? { ...l, qty: l.qty + 1 } : l));
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

  async function refund(sale: Sale) {
    if (
      !confirm(
        `Rembourser cette vente de ${formatPrice(
          sale.totalCents + sale.tipCents,
          currency
        )} ? Cette action est définitive.`
      )
    )
      return;
    const res = await fetch(`/api/caisse/refund/${sale.id}`, { method: "POST" });
    if (res.ok) loadSales();
    else alert((await res.json().catch(() => ({}))).error ?? "Échec du remboursement");
  }

  const cat = categories.find((c) => c.id === activeCat);

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Caisse</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full bg-surface p-1">
            {(
              [
                ["COUNTER", "🧾 Comptoir"],
                ["TABLES", "🍽️ Tables"],
                // Historique (chiffres du jour) : propriétaire seulement.
                ...(isOwner ? [["HISTORY", "🧮 Historique"] as const] : []),
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`relative rounded-full px-3.5 py-1.5 text-sm font-semibold ${
                  mode === m ? "bg-brand text-white" : "text-muted"
                }`}
              >
                {label}
                {m === "TABLES" && openOrders.length > 0 && (
                  <span className="ml-1.5 inline-grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                    {openOrders.length}
                  </span>
                )}
              </button>
            ))}
          </div>
          {isOwner && (
            <>
              <button
                onClick={() => setCashOpen(true)}
                className="rounded-xl bg-surface px-4 py-2 text-sm font-semibold"
              >
                💶 Fond
              </button>
              <button
                onClick={async () => {
                  const r = await fetch("/api/caisse/today", { cache: "no-store" });
                  if (r.ok) setCloture(await r.json());
                }}
                className="rounded-xl bg-surface px-4 py-2 text-sm font-semibold"
              >
                📊 Clôture
              </button>
              <button
                onClick={() => setSettingsOpen(true)}
                className="rounded-xl bg-surface px-3 py-2 text-sm font-semibold"
                title="Réglages caisse"
              >
                ⚙️
              </button>
            </>
          )}
        </div>
      </div>

      {mode === "COUNTER" && (
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

          {/* Ticket */}
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
      )}

      {mode === "TABLES" &&
        (openOrders.length === 0 ? (
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
        ))}

      {mode === "HISTORY" &&
        isOwner &&
        (sales.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted">
            Aucune vente encaissée aujourd’hui.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {sales.map((s) => (
                  <tr
                    key={s.id}
                    className={s.refunded ? "bg-red-500/5 text-muted" : ""}
                  >
                    <td className="px-3 py-2.5">
                      <p
                        className={`font-medium ${s.refunded ? "line-through" : ""}`}
                      >
                        {s.source === "COUNTER"
                          ? "Comptoir"
                          : s.tableNumber != null
                            ? `Table ${s.tableNumber}`
                            : "Table"}
                        {s.refunded && (
                          <span className="ml-2 rounded bg-red-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-red-500">
                            Remboursé
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {s.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                      </p>
                      {s.refunded && s.refundedByEmail && (
                        <p className="truncate text-[11px] text-red-500/80">
                          Remboursé par {s.refundedByEmail}
                        </p>
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-center text-xs text-muted">
                      {s.paymentMethod === "CARD"
                        ? "💳"
                        : s.paymentMethod === "CASH"
                          ? "💵"
                          : s.paymentMethod === "MOBILE"
                            ? "📱"
                            : "🌐"}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                      {formatPrice(s.totalCents + s.tipCents, currency)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {isOwner && !s.refunded ? (
                        <button
                          onClick={() => refund(s)}
                          className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-500/20"
                        >
                          Rembourser
                        </button>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

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
          onClose={() => {
            setReceipt(null);
            if (mode === "HISTORY") loadSales();
          }}
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

      {cashOpen && (
        <CashModal currency={currency} onClose={() => setCashOpen(false)} />
      )}

      {settingsOpen && (
        <SettingsModal
          currentPermille={vatRate}
          onClose={() => setSettingsOpen(false)}
          onSaved={(p) => {
            setVatRate(p);
            setSettingsOpen(false);
          }}
        />
      )}
    </div>
  );
}

function VatBlock({ vat, currency }: { vat: VatBucket[]; currency: string }) {
  if (!vat || vat.length === 0) return null;
  return (
    <div className="mt-2 space-y-0.5 text-xs text-muted">
      {vat.map((b) => (
        <div key={b.permille} className="flex justify-between">
          <span>
            Dont TVA {formatVatRate(b.permille)} (HT{" "}
            {formatPrice(b.htCents, currency)})
          </span>
          <span className="tabular-nums">{formatPrice(b.vatCents, currency)}</span>
        </div>
      ))}
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
  const [method, setMethod] = useState<PayMethod>("CASH");
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

      <div className="mt-4">
        <label className="text-sm text-muted">Remise</label>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {[0, 5, 10, 15, 20].map((p) => (
            <button
              key={p}
              onClick={() => setDiscountPct(p)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                discountPct === p ? "bg-brand text-white" : "bg-surface text-muted"
              }`}
            >
              {p === 0 ? "Aucune" : `${p}%`}
            </button>
          ))}
        </div>
      </div>

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

      <div className="mt-4 grid grid-cols-3 gap-2">
        {(["CASH", "CARD", "MOBILE"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMethod(m)}
            className={`rounded-xl border px-3 py-3 text-sm font-semibold ${
              method === m
                ? "border-brand bg-brand/15 text-brand"
                : "border-border bg-surface text-muted"
            }`}
          >
            {m === "CASH" ? "💵 Espèces" : m === "CARD" ? "💳 Carte" : "📱 Mobile"}
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
        <div className="text-left">
          <VatBlock vat={receipt.vat} currency={currency} />
        </div>
        <p className="mt-1 text-sm text-muted">
          {receipt.paymentMethod === "CASH"
            ? "Espèces"
            : receipt.paymentMethod === "MOBILE"
              ? "Mobile Money"
              : "Carte"}
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
      <p className="text-center font-display text-lg font-semibold">{restaurantName}</p>
      <p className="mb-3 text-center text-xs text-muted">
        Clôture du jour · {data.count} vente{data.count > 1 ? "s" : ""}
      </p>
      <div className="border-y border-dashed border-border py-2">
        {row("💵 Espèces", data.cashCents)}
        {row("💳 Carte", data.cardCents)}
        {row("📱 Mobile Money", data.mobileCents)}
        {row("🌐 En ligne / QR", data.onlineCents)}
      </div>
      {data.vat.length > 0 && (
        <div className="border-b border-dashed border-border py-2 text-muted">
          {data.vat.map((b) => (
            <div key={b.permille} className="flex justify-between py-0.5 text-sm">
              <span>TVA {formatVatRate(b.permille)}</span>
              <span className="tabular-nums">{formatPrice(b.vatCents, currency)}</span>
            </div>
          ))}
        </div>
      )}
      {(data.tipsCents > 0 || data.discountCents > 0 || data.refundedCount > 0) && (
        <div className="border-b border-dashed border-border py-2 text-muted">
          {data.tipsCents > 0 && row("Dont pourboires", data.tipsCents)}
          {data.discountCents > 0 && row("Remises accordées", data.discountCents)}
          {data.refundedCount > 0 &&
            row(`Remboursements (${data.refundedCount})`, -data.refundedCents)}
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

function CashModal({
  currency,
  onClose,
}: {
  currency: string;
  onClose: () => void;
}) {
  const [sess, setSess] = useState<CashSess>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [closed, setClosed] = useState<{
    openingCents: number;
    expectedCents: number;
    countedCents: number;
    diffCents: number;
  } | null>(null);

  const toCents = (s: string) =>
    Math.max(0, Math.round(parseFloat(s.replace(",", ".")) * 100) || 0);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/caisse/cash-session", { cache: "no-store" });
    if (r.ok) setSess((await r.json()).session);
    setLoading(false);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function open() {
    setBusy(true);
    await fetch("/api/caisse/cash-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "open", openingCents: toCents(amount) }),
    });
    setAmount("");
    setBusy(false);
    load();
  }
  async function close() {
    setBusy(true);
    const r = await fetch("/api/caisse/cash-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "close", countedCents: toCents(amount) }),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) setClosed(j.closed);
  }

  return (
    <Overlay onClose={onClose}>
      <h3 className="text-lg font-bold">Fond de caisse</h3>

      {loading ? (
        <p className="py-8 text-center text-sm text-muted">…</p>
      ) : closed ? (
        <div className="mt-4">
          <div className="space-y-1 rounded-xl bg-surface p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Fond d’ouverture</span>
              <span className="tabular-nums">
                {formatPrice(closed.openingCents, currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Attendu en caisse</span>
              <span className="tabular-nums">
                {formatPrice(closed.expectedCents, currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Compté</span>
              <span className="tabular-nums">
                {formatPrice(closed.countedCents, currency)}
              </span>
            </div>
            <div className="mt-1 flex justify-between border-t border-border pt-1 text-base font-bold">
              <span>Écart</span>
              <span
                className={`tabular-nums ${
                  closed.diffCents === 0
                    ? "text-emerald-500"
                    : "text-red-500"
                }`}
              >
                {closed.diffCents > 0 ? "+" : ""}
                {formatPrice(closed.diffCents, currency)}
              </span>
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-muted">
            {closed.diffCents === 0
              ? "Caisse juste ✔︎"
              : closed.diffCents > 0
                ? "Excédent en caisse"
                : "Manque en caisse"}
          </p>
          <button
            onClick={onClose}
            className="mt-4 w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white"
          >
            Fermer
          </button>
        </div>
      ) : sess ? (
        <div className="mt-4">
          <div className="space-y-1 rounded-xl bg-surface p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Fond d’ouverture</span>
              <span className="tabular-nums">
                {formatPrice(sess.openingCents, currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Ventes espèces</span>
              <span className="tabular-nums">
                {formatPrice(sess.cashSalesCents, currency)}
              </span>
            </div>
            <div className="mt-1 flex justify-between border-t border-border pt-1 font-bold">
              <span>Attendu en caisse</span>
              <span className="tabular-nums text-brand">
                {formatPrice(sess.expectedCents, currency)}
              </span>
            </div>
          </div>
          <label className="mt-4 block text-sm text-muted">Espèces comptées</label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="0"
            className="mt-1 w-full rounded-xl bg-surface px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-brand"
          />
          <button
            onClick={close}
            disabled={busy}
            className="mt-4 w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {busy ? "…" : "Clôturer la caisse"}
          </button>
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-sm text-muted">
            Ouvrez la caisse en indiquant le fond de départ (la monnaie déjà
            présente dans le tiroir).
          </p>
          <label className="mt-4 block text-sm text-muted">Fond d’ouverture</label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="0"
            className="mt-1 w-full rounded-xl bg-surface px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-brand"
          />
          <button
            onClick={open}
            disabled={busy}
            className="mt-4 w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {busy ? "…" : "Ouvrir la caisse"}
          </button>
        </div>
      )}
    </Overlay>
  );
}

function SettingsModal({
  currentPermille,
  onClose,
  onSaved,
}: {
  currentPermille: number;
  onClose: () => void;
  onSaved: (permille: number) => void;
}) {
  const [permille, setPermille] = useState(currentPermille);
  const [busy, setBusy] = useState(false);
  const options = [
    { label: "Aucune", value: 0 },
    { label: "5,5 %", value: 55 },
    { label: "10 %", value: 100 },
    { label: "20 %", value: 200 },
  ];

  async function save() {
    setBusy(true);
    const r = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vatPermille: permille }),
    });
    setBusy(false);
    if (r.ok) onSaved(permille);
  }

  return (
    <Overlay onClose={onClose}>
      <h3 className="text-lg font-bold">Réglages caisse</h3>
      <p className="mt-3 text-sm text-muted">
        Taux de TVA par défaut appliqué sur les tickets. (Un plat peut avoir son
        propre taux, ex. boissons alcoolisées.)
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => setPermille(o.value)}
            className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
              permille === o.value
                ? "border-brand bg-brand/15 text-brand"
                : "border-border bg-surface text-muted"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <button
        onClick={save}
        disabled={busy}
        className="mt-5 w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {busy ? "…" : "Enregistrer"}
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
