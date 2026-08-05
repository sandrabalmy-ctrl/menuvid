"use client";

import { useEffect, useState, useCallback } from "react";

type Item = {
  name: string;
  quantity: number;
  optionsText: string | null;
  note: string | null;
};
type Order = {
  id: string;
  status: string;
  tableNumber: number | null;
  createdAt: string;
  items: Item[];
};

const ACTIVE = ["RECEIVED", "PREPARING", "READY"];

// Étape suivante + libellé du bouton pour chaque statut.
const NEXT: Record<string, { to: string; label: string }> = {
  RECEIVED: { to: "PREPARING", label: "Commencer" },
  PREPARING: { to: "READY", label: "Prête ✓" },
  READY: { to: "SERVED", label: "Servie" },
};

const COL: Record<string, { title: string; ring: string; badge: string }> = {
  RECEIVED: { title: "À faire", ring: "border-amber-400", badge: "bg-amber-400 text-black" },
  PREPARING: { title: "En préparation", ring: "border-sky-400", badge: "bg-sky-400 text-black" },
  READY: { title: "Prêtes", ring: "border-emerald-400", badge: "bg-emerald-400 text-black" },
};

function ago(iso: string, now: number) {
  const min = Math.floor((now - new Date(iso).getTime()) / 60000);
  if (min < 1) return "à l’instant";
  return `il y a ${min} min`;
}

export function KitchenDisplay() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/dashboard/orders", { cache: "no-store" });
    if (res.ok) {
      const j = await res.json();
      setOrders((j.orders as Order[]).filter((o) => ACTIVE.includes(o.status)));
    }
  }, []);

  useEffect(() => {
    load();
    const a = setInterval(load, 4000);
    const b = setInterval(() => setNow(Date.now()), 30000);
    return () => {
      clearInterval(a);
      clearInterval(b);
    };
  }, [load]);

  async function advance(o: Order) {
    const next = NEXT[o.status];
    if (!next) return;
    setBusy(o.id);
    await fetch(`/api/orders/${o.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next.to }),
    });
    // Retrait optimiste si la commande quitte le tableau (servie).
    setOrders((prev) =>
      prev
        .map((x) => (x.id === o.id ? { ...x, status: next.to } : x))
        .filter((x) => ACTIVE.includes(x.status))
    );
    setBusy(null);
    load();
  }

  const columns = ["RECEIVED", "PREPARING", "READY"] as const;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {columns.map((status) => {
        const list = orders
          .filter((o) => o.status === status)
          .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
        const c = COL[status];
        return (
          <div key={status} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{c.title}</h2>
              <span className={`rounded-full px-2.5 py-0.5 text-sm font-bold ${c.badge}`}>
                {list.length}
              </span>
            </div>
            {list.length === 0 && (
              <p className="rounded-2xl bg-surface px-4 py-6 text-center text-sm text-muted">
                —
              </p>
            )}
            {list.map((o) => (
              <div
                key={o.id}
                className={`rounded-2xl border-2 bg-surface p-4 ${c.ring}`}
              >
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-xl font-black">
                    {o.tableNumber != null ? `Table ${o.tableNumber}` : "À emporter"}
                  </span>
                  <span className="text-xs text-muted">{ago(o.createdAt, now)}</span>
                </div>
                <ul className="space-y-1.5">
                  {o.items.map((it, i) => (
                    <li key={i} className="text-[15px] leading-tight">
                      <span className="font-bold">{it.quantity}×</span> {it.name}
                      {it.optionsText && (
                        <span className="block pl-5 text-sm text-muted">
                          {it.optionsText}
                        </span>
                      )}
                      {it.note && (
                        <span className="block pl-5 text-sm font-medium text-amber-500">
                          📝 {it.note}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => advance(o)}
                  disabled={busy === o.id}
                  className={`mt-3 w-full rounded-xl px-4 py-3 text-base font-bold ${c.badge} disabled:opacity-60`}
                >
                  {NEXT[o.status]?.label}
                </button>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
