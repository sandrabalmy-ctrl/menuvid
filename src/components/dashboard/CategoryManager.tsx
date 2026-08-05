"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Cat = { id: string; name: string; nameEn: string | null; dishCount: number };

export function CategoryManager({ categories }: { categories: Cat[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  async function call(url: string, method: string, body?: object) {
    setBusy(true);
    await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    setBusy(false);
    router.refresh();
  }

  async function add() {
    if (!newName.trim()) return;
    await call("/api/categories", "POST", { name: newName.trim() });
    setNewName("");
  }

  async function rename(id: string) {
    if (editValue.trim()) await call(`/api/categories/${id}`, "PATCH", { name: editValue.trim() });
    setEditing(null);
  }

  async function remove(c: Cat) {
    const msg =
      c.dishCount > 0
        ? `Supprimer « ${c.name} » et ses ${c.dishCount} plat(s) ? Cette action est définitive.`
        : `Supprimer la catégorie « ${c.name} » ?`;
    if (confirm(msg)) await call(`/api/categories/${c.id}`, "DELETE");
  }

  return (
    <div className="rounded-2xl bg-surface">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
      >
        <span>Gérer les catégories</span>
        <span className="text-muted">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="space-y-2 border-t border-border p-3">
          {categories.map((c, i) => (
            <div key={c.id} className="flex items-center gap-2">
              <div className="flex shrink-0 flex-col">
                <button
                  onClick={() => call(`/api/categories/${c.id}`, "PATCH", { direction: "up" })}
                  disabled={busy || i === 0}
                  className="text-xs text-muted disabled:opacity-30"
                  aria-label="Monter"
                >
                  ▲
                </button>
                <button
                  onClick={() => call(`/api/categories/${c.id}`, "PATCH", { direction: "down" })}
                  disabled={busy || i === categories.length - 1}
                  className="text-xs text-muted disabled:opacity-30"
                  aria-label="Descendre"
                >
                  ▼
                </button>
              </div>

              {editing === c.id ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => rename(c.id)}
                  onKeyDown={(e) => e.key === "Enter" && rename(c.id)}
                  className="flex-1 rounded-lg bg-surface-2 px-3 py-2 text-sm outline-none"
                />
              ) : (
                <button
                  onClick={() => {
                    setEditing(c.id);
                    setEditValue(c.name);
                  }}
                  className="flex-1 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-2"
                >
                  {c.name}{" "}
                  <span className="text-xs text-muted">({c.dishCount})</span>
                </button>
              )}

              <input
                defaultValue={c.nameEn ?? ""}
                onBlur={(e) =>
                  call(`/api/categories/${c.id}`, "PATCH", {
                    nameEn: e.target.value,
                  })
                }
                placeholder="EN"
                title="Nom en anglais"
                className="w-24 shrink-0 rounded-lg bg-surface-2 px-2 py-2 text-sm outline-none"
              />

              <button
                onClick={() => remove(c)}
                disabled={busy}
                className="shrink-0 px-2 py-2 text-sm text-muted hover:text-red-400"
                aria-label="Supprimer"
              >
                🗑
              </button>
            </div>
          ))}

          <div className="flex gap-2 pt-1">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="Nouvelle catégorie…"
              className="flex-1 rounded-lg bg-surface-2 px-3 py-2 text-sm outline-none"
            />
            <button
              onClick={add}
              disabled={busy || !newName.trim()}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Ajouter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
