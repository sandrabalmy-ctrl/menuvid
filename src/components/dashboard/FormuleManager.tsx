"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { parseSteps, type FormuleStep } from "@/lib/formules";

type DishLite = { id: string; name: string; priceCents: number };
type Category = { id: string; name: string; dishes: DishLite[] };
type Formule = {
  id: string;
  name: string;
  nameEn: string | null;
  description: string;
  descriptionEn: string | null;
  priceCents: number;
  stepsJson: string;
  available: boolean;
};

type StepDraft = { id: string; name: string; dishIds: string[] };

let stepSeq = 0;
const newStep = (name = ""): StepDraft => ({
  id: `s${Date.now()}-${stepSeq++}`,
  name,
  dishIds: [],
});

const emptyDraft = () => ({
  name: "",
  nameEn: "",
  description: "",
  priceEuros: "",
  steps: [newStep("Entrée"), newStep("Plat"), newStep("Dessert")],
});

export function FormuleManager({
  currency,
  formules,
  categories,
}: {
  currency: string;
  formules: Formule[];
  categories: Category[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const dishName = (id: string) => {
    for (const c of categories) {
      const d = c.dishes.find((x) => x.id === id);
      if (d) return d.name;
    }
    return null;
  };

  function startCreate() {
    setEditingId(null);
    setDraft(emptyDraft());
    setError(null);
    setOpen(true);
  }

  function startEdit(f: Formule) {
    const steps = parseSteps(f.stepsJson).map((s: FormuleStep) => ({
      id: s.id,
      name: s.name,
      dishIds: s.dishIds,
    }));
    setEditingId(f.id);
    setDraft({
      name: f.name,
      nameEn: f.nameEn ?? "",
      description: f.description,
      priceEuros: (f.priceCents / 100).toString(),
      steps: steps.length ? steps : [newStep("Entrée")],
    });
    setError(null);
    setOpen(true);
  }

  function toggleDish(stepIdx: number, dishId: string) {
    setDraft((d) => {
      const steps = d.steps.map((s, i) => {
        if (i !== stepIdx) return s;
        const has = s.dishIds.includes(dishId);
        return {
          ...s,
          dishIds: has
            ? s.dishIds.filter((x) => x !== dishId)
            : [...s.dishIds, dishId],
        };
      });
      return { ...d, steps };
    });
  }

  async function save() {
    setBusy(true);
    setError(null);
    const priceCents = Math.round(parseFloat(draft.priceEuros.replace(",", ".")) * 100);
    const payload = {
      name: draft.name,
      nameEn: draft.nameEn || null,
      description: draft.description,
      priceCents,
      steps: draft.steps
        .map((s) => ({ id: s.id, name: s.name, dishIds: s.dishIds }))
        .filter((s) => s.name.trim() && s.dishIds.length > 0),
    };
    const url = editingId ? `/api/formules/${editingId}` : "/api/formules";
    const res = await fetch(url, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else setError(j.error || "Enregistrement impossible.");
    setBusy(false);
  }

  async function remove(f: Formule) {
    if (!confirm(`Supprimer la formule « ${f.name} » ?`)) return;
    await fetch(`/api/formules/${f.id}`, { method: "DELETE" });
    router.refresh();
  }

  async function toggleAvailable(f: Formule) {
    await fetch(`/api/formules/${f.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: !f.available }),
    });
    router.refresh();
  }

  const noDishes = categories.every((c) => c.dishes.length === 0);
  const input =
    "w-full rounded-xl bg-surface px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand";

  return (
    <div className="space-y-5">
      {!open && (
        <button
          onClick={startCreate}
          disabled={noDishes}
          className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          + Nouvelle formule
        </button>
      )}
      {noDishes && (
        <p className="text-sm text-muted">
          Ajoutez d’abord des plats à votre menu : ils serviront à composer les
          étapes de vos formules.
        </p>
      )}

      {/* Éditeur */}
      {open && (
        <div className="space-y-5 rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              {editingId ? "Modifier la formule" : "Nouvelle formule"}
            </h3>
            <button
              onClick={() => setOpen(false)}
              className="text-sm text-muted hover:text-text"
            >
              Annuler
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs text-muted">Nom de la formule</span>
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Menu du midi"
                className={input}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted">Prix (€)</span>
              <input
                value={draft.priceEuros}
                onChange={(e) => setDraft({ ...draft, priceEuros: e.target.value })}
                inputMode="decimal"
                placeholder="18.90"
                className={input}
              />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-xs text-muted">Description (facultatif)</span>
            <input
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="Entrée + plat + dessert, servi le midi en semaine"
              className={input}
            />
          </label>

          {/* Étapes */}
          <div className="space-y-4">
            <p className="text-sm font-semibold">Étapes</p>
            {draft.steps.map((step, idx) => (
              <div key={step.id} className="rounded-xl border border-border p-3">
                <div className="mb-3 flex items-center gap-2">
                  <input
                    value={step.name}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        steps: d.steps.map((s, i) =>
                          i === idx ? { ...s, name: e.target.value } : s
                        ),
                      }))
                    }
                    placeholder="Nom de l'étape (ex. Entrée)"
                    className="flex-1 rounded-lg bg-surface px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-brand"
                  />
                  <button
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        steps: d.steps.filter((_, i) => i !== idx),
                      }))
                    }
                    className="shrink-0 rounded-lg bg-surface px-3 py-2 text-sm text-muted hover:text-red-400"
                  >
                    Retirer
                  </button>
                </div>
                <p className="mb-2 text-xs text-muted">
                  Plats proposés pour cette étape ({step.dishIds.length} sélectionné
                  {step.dishIds.length > 1 ? "s" : ""})
                </p>
                <div className="space-y-3">
                  {categories
                    .filter((c) => c.dishes.length > 0)
                    .map((c) => (
                      <div key={c.id}>
                        <p className="mb-1 text-xs font-semibold text-muted">
                          {c.name}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {c.dishes.map((d) => {
                            const on = step.dishIds.includes(d.id);
                            return (
                              <button
                                key={d.id}
                                onClick={() => toggleDish(idx, d.id)}
                                className={`rounded-full border px-3 py-1.5 text-xs transition ${
                                  on
                                    ? "border-brand bg-brand/15 text-brand"
                                    : "border-border bg-surface text-muted"
                                }`}
                              >
                                {on ? "✓ " : ""}
                                {d.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
            <button
              onClick={() =>
                setDraft((d) => ({ ...d, steps: [...d.steps, newStep()] }))
              }
              className="rounded-xl bg-surface px-4 py-2 text-sm font-medium"
            >
              + Ajouter une étape
            </button>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            onClick={save}
            disabled={busy}
            className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Enregistrement…" : "Enregistrer la formule"}
          </button>
        </div>
      )}

      {/* Liste des formules */}
      {formules.length > 0 && (
        <div className="space-y-2">
          {formules.map((f) => {
            const steps = parseSteps(f.stepsJson);
            return (
              <div
                key={f.id}
                className="rounded-2xl bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {f.name}{" "}
                      <span className="text-brand">
                        {formatPrice(f.priceCents, currency)}
                      </span>
                      {!f.available && (
                        <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">
                          en rupture
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {steps
                        .map(
                          (s) =>
                            `${s.name} (${s.dishIds
                              .map((id) => dishName(id))
                              .filter(Boolean).length} choix)`
                        )
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2 text-sm">
                    <button
                      onClick={() => toggleAvailable(f)}
                      className="text-muted hover:text-text"
                    >
                      {f.available ? "Masquer" : "Afficher"}
                    </button>
                    <button
                      onClick={() => startEdit(f)}
                      className="text-brand"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => remove(f)}
                      className="text-muted hover:text-red-400"
                    >
                      Suppr.
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
