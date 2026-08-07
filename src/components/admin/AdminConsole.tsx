"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RestaurantOverview } from "@/lib/admin-data";
import { PLANS, type Plan } from "@/lib/plan";
import { formatPrice } from "@/lib/format";

const PLAN_KEYS: Plan[] = ["ESSENTIAL", "VIDEO", "ORDER"];

export function AdminConsole({
  restaurants,
}: {
  restaurants: RestaurantOverview[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function changePlan(id: string, plan: string) {
    setBusy(id);
    await fetch(`/api/admin/restaurants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    setBusy(null);
    router.refresh();
  }

  async function toggleStatus(r: RestaurantOverview) {
    setBusy(r.id);
    await fetch(`/api/admin/restaurants/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: r.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
      }),
    });
    setBusy(null);
    router.refresh();
  }

  async function remove(r: RestaurantOverview) {
    if (!confirm(`Supprimer définitivement « ${r.name} » et toutes ses données ?`))
      return;
    setBusy(r.id);
    await fetch(`/api/admin/restaurants/${r.id}`, { method: "DELETE" });
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
        >
          {showForm ? "Fermer" : "+ Nouveau restaurant"}
        </button>
      </div>

      {showForm && <NewRestaurantForm onDone={() => { setShowForm(false); router.refresh(); }} />}

      <div className="space-y-3">
        {restaurants.map((r) => (
          <div key={r.id} className="rounded-2xl bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 font-semibold">
                  {r.name}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] ${
                      r.status === "ACTIVE"
                        ? "bg-emerald-500/15 text-emerald-700"
                        : "bg-red-500/15 text-red-700"
                    }`}
                  >
                    {r.status === "ACTIVE" ? "Actif" : "Suspendu"}
                  </span>
                </p>
                <p className="text-xs text-muted">
                  /r/{r.slug} · {r.ownerEmail ?? "—"}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {r.dishes} plats · {r.orders} commandes ·{" "}
                  {formatPrice(r.monthlyCents, "EUR")}/mois
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={r.plan}
                  onChange={(e) => changePlan(r.id, e.target.value)}
                  disabled={busy === r.id}
                  className="rounded-lg bg-surface-2 px-3 py-2 text-sm outline-none"
                >
                  {PLAN_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {PLANS[k].label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => toggleStatus(r)}
                  disabled={busy === r.id}
                  className="rounded-lg bg-surface-2 px-3 py-2 text-sm"
                >
                  {r.status === "ACTIVE" ? "Suspendre" : "Réactiver"}
                </button>
                <a
                  href={`/r/${r.slug}/t/1`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-surface-2 px-3 py-2 text-sm"
                >
                  Voir le menu ↗
                </a>
                <button
                  onClick={() => remove(r)}
                  disabled={busy === r.id}
                  className="rounded-lg px-2 py-2 text-sm text-muted hover:text-red-400"
                >
                  🗑
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewRestaurantForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [plan, setPlan] = useState<Plan>("VIDEO");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/restaurants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, ownerEmail, ownerPassword, plan }),
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok) {
      onDone();
    } else {
      setError(j.error || "Création impossible.");
      setSaving(false);
    }
  }

  const input =
    "w-full rounded-xl bg-surface-2 px-4 py-3 outline-none focus:ring-2 focus:ring-brand";

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl bg-surface p-4">
      <h3 className="font-semibold">Nouveau restaurant client</h3>
      <input
        className={input}
        placeholder="Nom du restaurant"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="grid gap-3 md:grid-cols-2">
        <input
          className={input}
          type="email"
          placeholder="Email du propriétaire"
          value={ownerEmail}
          onChange={(e) => setOwnerEmail(e.target.value)}
        />
        <input
          className={input}
          type="text"
          placeholder="Mot de passe initial (8 car., 1 lettre + 1 chiffre)"
          value={ownerPassword}
          onChange={(e) => setOwnerPassword(e.target.value)}
        />
      </div>
      <select
        className={input}
        value={plan}
        onChange={(e) => setPlan(e.target.value as Plan)}
      >
        {PLAN_KEYS.map((k) => (
          <option key={k} value={k}>
            Palier {PLANS[k].label} — {formatPrice(PLANS[k].priceCents, "EUR")}/mois
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <p className="text-xs text-muted">
        Crée automatiquement : le restaurant, le compte propriétaire, les
        catégories de base, 8 tables avec QR, et l’abonnement.
      </p>
      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Création…" : "Créer le restaurant"}
      </button>
    </form>
  );
}
