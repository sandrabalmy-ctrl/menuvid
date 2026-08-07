"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PLANS, planPriceCents, type Plan } from "@/lib/plan";
import { formatPrice } from "@/lib/format";

const FEATURE_LABELS: Record<string, string> = {
  menu: "Menu digital",
  photos: "Photos par plat",
  qr: "QR codes par table",
  video: "Vidéo par plat",
  ordering: "Commande en cuisine",
  analytics: "Statistiques avancées",
};

const ORDER: Plan[] = ["ESSENTIAL", "VIDEO", "ORDER"];

export function PlanSelector({
  currentPlan,
  currency,
}: {
  currentPlan: string;
  currency: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function choose(plan: Plan) {
    if (plan === currentPlan) return;
    setBusy(plan);
    setMessage(null);
    const res = await fetch("/api/billing/change-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const j = await res.json().catch(() => ({}));
    if (j.url) {
      window.location.href = j.url; // redirection vers le paiement Stripe
      return;
    }
    if (j.demo) {
      setMessage(
        `Palier « ${PLANS[plan].label} » activé (mode démo — sans paiement réel).`
      );
      router.refresh();
    } else if (j.error) {
      setMessage(j.error);
    }
    setBusy(null);
  }

  async function openPortal() {
    setBusy("portal");
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const j = await res.json().catch(() => ({}));
    if (j.url) {
      window.location.href = j.url;
      return;
    }
    setMessage(j.error || "Portail indisponible.");
    setBusy(null);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        {ORDER.map((key) => {
          const p = PLANS[key];
          const current = key === currentPlan;
          return (
            <div
              key={key}
              className={`rounded-2xl border p-5 ${
                current ? "border-brand bg-surface" : "border-border bg-surface"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">{p.label}</h3>
                {current && (
                  <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-medium text-white">
                    Actuel
                  </span>
                )}
              </div>
              <p className="mt-1 text-2xl font-bold">
                {formatPrice(planPriceCents(key, currency), currency)}
                <span className="text-sm font-normal text-muted">/mois</span>
              </p>
              <ul className="mt-4 space-y-1.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span>
                    {FEATURE_LABELS[f] ?? f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => choose(key)}
                disabled={current || busy === key}
                className={`mt-5 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  current
                    ? "cursor-default bg-surface-2 text-muted"
                    : "bg-brand text-white active:scale-[0.98]"
                }`}
              >
                {current
                  ? "Palier actuel"
                  : busy === key
                    ? "…"
                    : "Choisir ce palier"}
              </button>
            </div>
          );
        })}
      </div>

      {message && (
        <p className="rounded-xl bg-surface px-4 py-3 text-sm text-emerald-300">
          {message}
        </p>
      )}

      <button
        onClick={openPortal}
        disabled={busy === "portal"}
        className="rounded-xl bg-surface px-5 py-3 text-sm font-medium"
      >
        Gérer ma facturation (factures, carte, résiliation)
      </button>
    </div>
  );
}
