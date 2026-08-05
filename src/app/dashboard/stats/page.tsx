import { requireOwner } from "@/lib/require-owner";
import { getDashboard, getDishStats } from "@/lib/stats";
import { formatPrice } from "@/lib/format";

export default async function StatsPage() {
  const { restaurant } = await requireOwner();
  const [kpi, stats] = await Promise.all([
    getDashboard(restaurant.id),
    getDishStats(restaurant.id),
  ]);

  const maxViews = Math.max(1, ...stats.map((s) => s.views));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Statistiques</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Vues vidéo (jour)", value: String(kpi.totalViews) },
          { label: "Commandes (jour)", value: String(kpi.countToday) },
          { label: "Panier moyen", value: formatPrice(kpi.avgBasket, restaurant.currency) },
          { label: "CA du jour", value: formatPrice(kpi.revenueToday, restaurant.currency) },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl bg-surface p-4">
            <p className="text-xs text-muted">{c.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{c.value}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-3 font-semibold">Performance par plat</h2>
        <div className="overflow-hidden rounded-2xl bg-surface">
          <div className="hidden grid-cols-12 gap-2 border-b border-border px-4 py-2 text-xs text-muted md:grid">
            <span className="col-span-5">Plat</span>
            <span className="col-span-3">Vues vidéo</span>
            <span className="col-span-2 text-right">Ajouts panier</span>
            <span className="col-span-2 text-right">Conversion</span>
          </div>
          {stats.map((s) => (
            <div
              key={s.dishId}
              className="grid grid-cols-12 items-center gap-2 border-b border-border px-4 py-3 text-sm last:border-0"
            >
              <span className="col-span-12 font-medium md:col-span-5">
                {s.name}
              </span>
              <span className="col-span-6 md:col-span-3">
                <span className="flex items-center gap-2">
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <span
                      className="block h-full rounded-full bg-brand"
                      style={{ width: `${(s.views / maxViews) * 100}%` }}
                    />
                  </span>
                  <span className="w-8 text-right tabular-nums text-muted">
                    {s.views}
                  </span>
                </span>
              </span>
              <span className="col-span-3 text-right tabular-nums text-muted md:col-span-2">
                {s.addToCart}
              </span>
              <span className="col-span-3 text-right tabular-nums font-medium text-brand md:col-span-2">
                {s.conversion}%
              </span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">
          Conversion = commandes ÷ vues vidéo. Repérez les plats très regardés mais
          peu commandés (prix ? description ?) et vos meilleures ventes.
        </p>
      </section>
    </div>
  );
}
