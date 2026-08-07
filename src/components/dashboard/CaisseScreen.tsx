"use client";

import { useMemo, useState } from "react";
import { formatPrice } from "@/lib/format";

type Dish = { id: string; name: string; priceCents: number };
type Category = { id: string; name: string; dishes: Dish[] };
type Line = { dishId: string; name: string; priceCents: number; qty: number };

type Receipt = {
  totalCents: number;
  paymentMethod: string;
  amountReceivedCents: number;
  changeCents: number;
  items: { name: string; quantity: number; unitPriceCents: number }[];
  at: string;
};

type Today = {
  count: number;
  counterCount: number;
  totalCents: number;
  cashCents: number;
  cardCents: number;
  onlineCents: number;
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
  const [activeCat, setActiveCat] = useState(categories[0]?.id ?? "");
  const [lines, setLines] = useState<Line[]>([]);
  const [payOpen, setPayOpen] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [cloture, setCloture] = useState<Today | null>(null);

  const total = useMemo(
    () => lines.reduce((s, l) => s + l.priceCents * l.qty, 0),
    [lines]
  );
  const count = lines.reduce((s, l) => s + l.qty, 0);

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

  const cat = categories.find((c) => c.id === activeCat);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      {/* Catalogue */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Caisse</h1>
          <button
            onClick={async () => {
              const r = await fetch("/api/caisse/today", { cache: "no-store" });
              if (r.ok) setCloture(await r.json());
            }}
            className="rounded-xl bg-surface px-4 py-2 text-sm font-semibold"
          >
            📊 Clôture du jour
          </button>
        </div>

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
            onClick={() => setPayOpen(true)}
            disabled={lines.length === 0}
            className="flex-1 rounded-xl bg-brand px-4 py-3 font-semibold text-white disabled:opacity-40"
          >
            Encaisser — {formatPrice(total, currency)}
          </button>
        </div>
      </div>

      {payOpen && (
        <PayModal
          total={total}
          currency={currency}
          lines={lines}
          onClose={() => setPayOpen(false)}
          onDone={(r) => {
            setReceipt(r);
            setLines([]);
            setPayOpen(false);
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
  total,
  currency,
  lines,
  onClose,
  onDone,
}: {
  total: number;
  currency: string;
  lines: Line[];
  onClose: () => void;
  onDone: (r: Receipt) => void;
}) {
  const [method, setMethod] = useState<"CASH" | "CARD">("CASH");
  const [received, setReceived] = useState("");
  const [busy, setBusy] = useState(false);
  const receivedCents = Math.round(parseFloat(received.replace(",", ".")) * 100) || 0;
  const change = method === "CASH" && receivedCents > total ? receivedCents - total : 0;

  async function validate() {
    setBusy(true);
    const res = await fetch("/api/caisse/sale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: lines.map((l) => ({ dishId: l.dishId, quantity: l.qty })),
        paymentMethod: method,
        amountReceivedCents: receivedCents,
      }),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      onDone({
        totalCents: j.totalCents,
        paymentMethod: j.paymentMethod,
        amountReceivedCents: j.amountReceivedCents,
        changeCents: j.changeCents,
        items: j.items,
        at: j.createdAt,
      });
    }
  }

  return (
    <Overlay onClose={onClose}>
      <h3 className="text-lg font-bold">Encaissement</h3>
      <p className="mt-1 text-2xl font-bold text-brand">
        {formatPrice(total, currency)}
      </p>

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

      <button
        onClick={validate}
        disabled={busy}
        className="mt-5 w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {busy ? "…" : "Valider l’encaissement"}
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
        <p className="text-xs text-muted">Ticket de caisse</p>
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
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span className="tabular-nums">
            {formatPrice(receipt.totalCents, currency)}
          </span>
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
          Nouvelle vente
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
      <div className="relative w-full max-w-sm rounded-3xl border border-border bg-bg p-6">
        {children}
      </div>
    </div>
  );
}
