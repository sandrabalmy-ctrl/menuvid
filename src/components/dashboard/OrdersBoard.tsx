"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/format";

// Petit "ding" quand une nouvelle commande arrive (sans fichier audio).
function ding() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const notes = [880, 1320];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.start(t);
      osc.stop(t + 0.24);
    });
  } catch {}
}

type Order = {
  id: string;
  status: string;
  totalCents: number;
  tipCents?: number;
  paid?: boolean;
  tableNumber: number | null;
  createdAt: string;
  items: {
    name: string;
    quantity: number;
    optionsText?: string | null;
    note?: string | null;
  }[];
};

const NEXT: Record<string, { status: string; label: string } | null> = {
  RECEIVED: { status: "PREPARING", label: "Mettre en préparation" },
  PREPARING: { status: "READY", label: "Marquer prête" },
  READY: { status: "SERVED", label: "Marquer servie" },
  SERVED: null,
  CANCELLED: null,
};

const STATUS_LABEL: Record<string, string> = {
  RECEIVED: "Reçue",
  PREPARING: "En préparation",
  READY: "Prête",
  SERVED: "Servie",
  CANCELLED: "Annulée",
};

const STATUS_COLOR: Record<string, string> = {
  RECEIVED: "bg-blue-500/15 text-blue-700",
  PREPARING: "bg-amber-500/20 text-amber-700",
  READY: "bg-emerald-500/15 text-emerald-700",
  SERVED: "bg-black/5 text-muted",
  CANCELLED: "bg-red-500/15 text-red-700",
};

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  return `il y a ${Math.floor(mins / 60)} h`;
}

type ServiceReq = {
  id: string;
  tableNumber: number | null;
  type: string;
  createdAt: string;
};

type TableSess = {
  id: string;
  tableNumber: number | null;
  totalCents: number;
  paidCents: number;
  remainingCents: number;
  orderCount: number;
};

export function OrdersBoard({ currency }: { currency: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [requests, setRequests] = useState<ServiceReq[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [notifOn, setNotifOn] = useState(false);
  const [online, setOnline] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const seenIds = useRef<Set<string>>(new Set());
  const seenReqIds = useRef<Set<string>>(new Set());
  const firstLoad = useRef(true);
  const unseen = useRef(0);
  const soundOnRef = useRef(true);
  const notifOnRef = useRef(false);
  soundOnRef.current = soundOn;
  notifOnRef.current = notifOn;

  function refreshTitle() {
    if (typeof document === "undefined") return;
    document.title =
      unseen.current > 0 && document.hidden
        ? `🔴 (${unseen.current}) Nouvelle commande — MenuVid`
        : "Commandes — MenuVid";
  }

  function notifyDesktop(count: number) {
    try {
      if (
        notifOnRef.current &&
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      ) {
        new Notification("Nouvelle commande 🔔", {
          body: `${count} nouvelle(s) demande(s) à traiter.`,
        });
      }
    } catch {}
  }

  const load = useCallback(async () => {
    try {
      const [ordersRes, reqRes] = await Promise.all([
        fetch("/api/dashboard/orders", { cache: "no-store" }),
        fetch("/api/dashboard/service-requests", { cache: "no-store" }),
      ]);

      let freshCount = 0;

      if (ordersRes.ok) {
        const j = await ordersRes.json();
        const list: Order[] = j.orders;
        const freshReceived = list.filter(
          (o) => o.status === "RECEIVED" && !seenIds.current.has(o.id)
        );
        list.forEach((o) => seenIds.current.add(o.id));
        if (!firstLoad.current) freshCount += freshReceived.length;
        setOrders(list);
      }

      if (reqRes.ok) {
        const j = await reqRes.json();
        const list: ServiceReq[] = j.requests;
        const fresh = list.filter((r) => !seenReqIds.current.has(r.id));
        list.forEach((r) => seenReqIds.current.add(r.id));
        if (!firstLoad.current) freshCount += fresh.length;
        setRequests(list);
      }

      if (!firstLoad.current && freshCount > 0) {
        if (soundOnRef.current) ding();
        if (typeof document !== "undefined" && document.hidden) {
          unseen.current += freshCount;
          notifyDesktop(freshCount);
          refreshTitle();
        }
      }
      firstLoad.current = false;
      setOnline(true);
      setLastUpdate(Date.now());
      setLoaded(true);
    } catch {
      setOnline(false); // coupure réseau → on l'indique, le polling continue
    }
  }, []);

  async function resolveRequest(id: string) {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    await fetch(`/api/service-requests/${id}`, { method: "PATCH" });
    load();
  }

  // Additions de table ouvertes (sondées à part).
  const [sessions, setSessions] = useState<TableSess[]>([]);
  useEffect(() => {
    let alive = true;
    async function poll() {
      try {
        const res = await fetch("/api/dashboard/sessions", { cache: "no-store" });
        if (res.ok && alive) setSessions((await res.json()).sessions);
      } catch {}
    }
    poll();
    const t = setInterval(poll, 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  async function settleSession(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    await fetch(`/api/dashboard/sessions/${id}/settle`, { method: "POST" });
  }

  async function enableNotifications() {
    try {
      if (typeof Notification === "undefined") return;
      const perm = await Notification.requestPermission();
      setNotifOn(perm === "granted");
    } catch {}
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 3000); // rafraîchit toutes les 3s
    const onVisible = () => {
      if (!document.hidden) unseen.current = 0;
      refreshTitle();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
      document.title = "MenuVid";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  async function setStatus(id: string, status: string) {
    // Mise à jour optimiste
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  const active = orders.filter((o) =>
    ["RECEIVED", "PREPARING", "READY"].includes(o.status)
  );
  const done = orders.filter((o) => ["SERVED", "CANCELLED"].includes(o.status));

  if (!loaded) {
    return <p className="text-muted">Chargement des commandes…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`inline-flex items-center gap-1.5 font-medium ${
              online ? "text-emerald-600" : "text-red-600"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                online ? "animate-pulse bg-emerald-500" : "bg-red-500"
              }`}
            />
            {online ? "En direct" : "Reconnexion…"}
          </span>
          {lastUpdate && (
            <span className="text-muted">
              · mis à jour à{" "}
              {new Date(lastUpdate).toLocaleTimeString("fr-FR")}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={enableNotifications}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              notifOn
                ? "bg-emerald-500/15 text-emerald-700"
                : "bg-surface text-muted hover:text-text"
            }`}
            title="Recevoir une alerte même quand l'onglet est en arrière-plan"
          >
            {notifOn ? "🔔 Alertes activées" : "🔔 Activer les alertes"}
          </button>
          <button
            onClick={() => setSoundOn((v) => !v)}
            className="rounded-lg bg-surface px-3 py-1.5 text-sm text-muted hover:text-text"
            title="Son à l'arrivée d'une commande"
          >
            {soundOn ? "🔊 Son activé" : "🔕 Son coupé"}
          </button>
        </div>
      </div>

      {/* Demandes de service (appeler serveur / addition) */}
      {requests.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold">
            Demandes <span className="text-muted">({requests.length})</span>
          </h2>
          <div className="grid gap-2 md:grid-cols-2">
            {requests.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-xl bg-amber-500/15 px-4 py-3"
              >
                <span className="text-sm">
                  <span className="font-semibold">
                    {r.type === "BILL" ? "🧾 Addition" : "🙋 Serveur"}
                  </span>{" "}
                  ·{" "}
                  {r.tableNumber != null ? `Table ${r.tableNumber}` : "—"}{" "}
                  <span className="text-muted">{timeAgo(r.createdAt)}</span>
                </span>
                <button
                  onClick={() => resolveRequest(r.id)}
                  className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white active:scale-95"
                >
                  Fait
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Additions de table ouvertes */}
      {sessions.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold">
            Tables ouvertes <span className="text-muted">({sessions.length})</span>
          </h2>
          <div className="grid gap-2 md:grid-cols-2">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl bg-surface px-4 py-3"
              >
                <span className="text-sm">
                  <span className="font-semibold">
                    {s.tableNumber != null ? `Table ${s.tableNumber}` : "À emporter"}
                  </span>{" "}
                  <span className="text-muted">
                    · {s.orderCount} tournée{s.orderCount > 1 ? "s" : ""} ·{" "}
                    {formatPrice(s.totalCents, currency)}
                    {s.paidCents > 0 && s.remainingCents > 0 && (
                      <span className="text-emerald-600">
                        {" "}
                        (reste {formatPrice(s.remainingCents, currency)})
                      </span>
                    )}
                    {s.remainingCents === 0 && (
                      <span className="text-emerald-600"> · payé ✅</span>
                    )}
                  </span>
                </span>
                <button
                  onClick={() => settleSession(s.id)}
                  className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white active:scale-95"
                  title="Encaisser et clôturer l'addition"
                >
                  Clôturer
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-semibold">
          En cours <span className="text-muted">({active.length})</span>
        </h2>
        {active.length === 0 ? (
          <p className="rounded-2xl bg-surface px-4 py-8 text-center text-muted">
            Aucune commande en cours. Les nouvelles commandes apparaîtront ici
            automatiquement.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {active.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                currency={currency}
                onAdvance={setStatus}
                onCancel={(id) => setStatus(id, "CANCELLED")}
              />
            ))}
          </div>
        )}
      </section>

      {done.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold text-muted">Terminées</h2>
          <div className="grid gap-2 md:grid-cols-2">
            {done.slice(0, 10).map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 text-sm"
              >
                <span>
                  {o.tableNumber != null ? `Table ${o.tableNumber}` : "À emporter"} ·{" "}
                  <span className="text-muted">{timeAgo(o.createdAt)}</span>
                </span>
                <span className="flex items-center gap-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLOR[o.status]}`}>
                    {STATUS_LABEL[o.status]}
                  </span>
                  <span className="tabular-nums">
                    {formatPrice(o.totalCents + (o.tipCents ?? 0), currency)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function OrderCard({
  order,
  currency,
  onAdvance,
  onCancel,
}: {
  order: Order;
  currency: string;
  onAdvance: (id: string, status: string) => void;
  onCancel: (id: string) => void;
}) {
  const next = NEXT[order.status];
  return (
    <div
      className={`rounded-2xl bg-surface p-4 ${
        order.status === "RECEIVED"
          ? "ring-2 ring-brand/40 animate-rise"
          : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold">
          {order.tableNumber != null ? `Table ${order.tableNumber}` : "À emporter"}
        </span>
        <span className={`rounded-full px-2.5 py-1 text-xs ${STATUS_COLOR[order.status]}`}>
          {STATUS_LABEL[order.status]}
        </span>
      </div>
      <p className="mt-0.5 flex items-center gap-2 text-xs text-muted">
        {timeAgo(order.createdAt)}
        {order.paid && (
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-medium text-emerald-700">
            ✅ Payé en ligne
          </span>
        )}
      </p>

      <ul className="mt-3 space-y-1 text-sm">
        {order.items.map((it, idx) => (
          <li key={idx}>
            <span className="font-medium">{it.quantity}×</span> {it.name}
            {it.optionsText && (
              <span className="block pl-5 text-xs text-muted">{it.optionsText}</span>
            )}
            {it.note && <span className="block pl-5 text-xs text-muted">« {it.note} »</span>}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between">
        <span className="font-bold tabular-nums">
          {formatPrice(order.totalCents + (order.tipCents ?? 0), currency)}
          {order.tipCents ? (
            <span className="ml-1 text-xs font-normal text-emerald-400">
              (+{formatPrice(order.tipCents, currency)} pourboire)
            </span>
          ) : null}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => onCancel(order.id)}
            className="rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted hover:text-red-300"
          >
            Annuler
          </button>
          {next && (
            <button
              onClick={() => onAdvance(order.id, next.status)}
              className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white active:scale-95"
            >
              {next.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
