"use client";

import type { OptionGroup } from "@/lib/options";

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

export function DishOptionsEditor({
  value,
  onChange,
}: {
  value: OptionGroup[];
  onChange: (groups: OptionGroup[]) => void;
}) {
  function update(groups: OptionGroup[]) {
    onChange(groups);
  }

  function addGroup() {
    update([
      ...value,
      {
        id: genId(),
        name: "",
        type: "single",
        required: false,
        choices: [{ id: genId(), label: "", priceCents: 0 }],
      },
    ]);
  }
  function setGroup(i: number, patch: Partial<OptionGroup>) {
    update(value.map((g, j) => (j === i ? { ...g, ...patch } : g)));
  }
  function removeGroup(i: number) {
    update(value.filter((_, j) => j !== i));
  }
  function addChoice(gi: number) {
    setGroup(gi, {
      choices: [...value[gi].choices, { id: genId(), label: "", priceCents: 0 }],
    });
  }
  function setChoice(gi: number, ci: number, patch: Partial<OptionGroup["choices"][0]>) {
    setGroup(gi, {
      choices: value[gi].choices.map((c, j) => (j === ci ? { ...c, ...patch } : c)),
    });
  }
  function removeChoice(gi: number, ci: number) {
    setGroup(gi, { choices: value[gi].choices.filter((_, j) => j !== ci) });
  }

  const input =
    "rounded-lg bg-surface-2 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand";

  return (
    <div className="rounded-2xl border border-border p-4">
      <p className="mb-1 text-sm font-medium">Options du plat (facultatif)</p>
      <p className="mb-3 text-xs text-muted">
        Cuisson, taille, suppléments… Chaque choix peut ajouter au prix.
      </p>

      <div className="space-y-4">
        {value.map((g, gi) => (
          <div key={g.id} className="rounded-xl bg-surface p-3">
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={g.name}
                onChange={(e) => setGroup(gi, { name: e.target.value })}
                placeholder="Nom (ex. Cuisson)"
                className={`${input} flex-1`}
              />
              <select
                value={g.type}
                onChange={(e) =>
                  setGroup(gi, { type: e.target.value as OptionGroup["type"] })
                }
                className={input}
              >
                <option value="single">Choix unique</option>
                <option value="multiple">Choix multiple</option>
              </select>
              <label className="flex items-center gap-1.5 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={g.required}
                  onChange={(e) => setGroup(gi, { required: e.target.checked })}
                  className="h-4 w-4 accent-[var(--brand)]"
                />
                obligatoire
              </label>
              <button
                type="button"
                onClick={() => removeGroup(gi)}
                className="text-muted hover:text-red-400"
                aria-label="Supprimer le groupe"
              >
                🗑
              </button>
            </div>

            <div className="mt-2 space-y-2 pl-1">
              {g.choices.map((c, ci) => (
                <div key={c.id} className="flex items-center gap-2">
                  <span className="text-muted">•</span>
                  <input
                    value={c.label}
                    onChange={(e) => setChoice(gi, ci, { label: e.target.value })}
                    placeholder="Choix (ex. À point)"
                    className={`${input} flex-1`}
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted">+</span>
                    <input
                      type="number"
                      step="0.10"
                      min="0"
                      value={(c.priceCents / 100).toString()}
                      onChange={(e) =>
                        setChoice(gi, ci, {
                          priceCents: Math.max(
                            0,
                            Math.round((Number(e.target.value) || 0) * 100)
                          ),
                        })
                      }
                      className={`${input} w-20`}
                      title="Supplément en €"
                    />
                    <span className="text-xs text-muted">€</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeChoice(gi, ci)}
                    className="text-muted hover:text-red-400"
                    aria-label="Supprimer le choix"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addChoice(gi)}
                className="ml-4 text-xs text-brand"
              >
                + Ajouter un choix
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addGroup}
        className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-sm"
      >
        + Ajouter un groupe d’options
      </button>
    </div>
  );
}
