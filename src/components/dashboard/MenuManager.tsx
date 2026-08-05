"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";

type Dish = {
  id: string;
  name: string;
  priceCents: number;
  photoUrl: string | null;
  videoUrl: string | null;
  available: boolean;
};
type Category = { id: string; name: string; dishes: Dish[] };

export function MenuManager({
  categories,
  currency,
}: {
  categories: Category[];
  currency: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function toggleAvailable(dish: Dish) {
    setBusy(dish.id);
    await fetch(`/api/dishes/${dish.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: !dish.available }),
    });
    setBusy(null);
    router.refresh();
  }

  async function remove(dish: Dish) {
    if (!confirm(`Supprimer « ${dish.name} » ? Cette action est définitive.`)) return;
    setBusy(dish.id);
    await fetch(`/api/dishes/${dish.id}`, { method: "DELETE" });
    setBusy(null);
    router.refresh();
  }

  const empty = categories.every((c) => c.dishes.length === 0);

  return (
    <div className="space-y-6">
      {empty && (
        <p className="rounded-2xl bg-surface px-4 py-8 text-center text-muted">
          Votre menu est vide. Ajoutez votre premier plat !
        </p>
      )}

      {categories.map((cat) => (
        <section key={cat.id}>
          <h2 className="mb-2 font-semibold">{cat.name}</h2>
          <div className="overflow-hidden rounded-2xl bg-surface">
            {cat.dishes.length === 0 && (
              <p className="px-4 py-4 text-sm text-muted">Aucun plat.</p>
            )}
            {cat.dishes.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-3 border-b border-border px-3 py-3 last:border-0"
              >
                {d.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.photoUrl}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-surface-2 text-xl">
                    🍽️
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-medium">
                    <span className="truncate">{d.name}</span>
                    {d.videoUrl && <span title="Vidéo présente">🎬</span>}
                  </p>
                  <p className="text-sm text-muted">
                    {formatPrice(d.priceCents, currency)}
                  </p>
                </div>

                {/* Interrupteur disponibilité */}
                <button
                  onClick={() => toggleAvailable(d)}
                  disabled={busy === d.id}
                  title={d.available ? "Disponible" : "En rupture"}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                    d.available ? "bg-emerald-500" : "bg-surface-2"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-all ${
                      d.available ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>

                <Link
                  href={`/dashboard/menu/${d.id}`}
                  className="shrink-0 rounded-lg bg-surface-2 px-3 py-2 text-sm"
                >
                  Modifier
                </Link>
                <button
                  onClick={() => remove(d)}
                  disabled={busy === d.id}
                  className="shrink-0 rounded-lg px-2 py-2 text-sm text-muted hover:text-red-400"
                  title="Supprimer"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
