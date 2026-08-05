import Link from "next/link";
import { requireOwner } from "@/lib/require-owner";
import { getDashboard, getDishStats } from "@/lib/stats";
import { formatPrice } from "@/lib/format";
import { OrderingToggle } from "@/components/dashboard/OrderingToggle";

export default async function DashboardHome() {
  const { restaurant } = await requireOwner();
  const [kpi, dishStats] = await Promise.all([
    getDashboard(restaurant.id),
    getDishStats(restaurant.id),
  ]);
  const topViewed = dishStats.slice(0, 5);

  const cards = [
    { label: "CA du jour", value: formatPrice(kpi.revenueToday, restaurant.currency) },
    { label: "Commandes du jour", value: String(kpi.countToday) },
    { label: "Panier moyen", value: formatPrice(kpi.avgBasket, restaurant.currency) },
    { label: "Commandes en cours", value: String(kpi.activeOrders), href: "/dashboard/commandes" },
    { label: "Vues vidéo (jour)", value: String(kpi.totalViews) },
    { label: "Plats au menu", value: String(kpi.dishesCount), href: "/dashboard/menu" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bonjour 👋</h1>

      <OrderingToggle paused={restaurant.orderingPaused} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {cards.map((c) => {
          const inner = (
            <div className="rounded-2xl bg-surface p-4">
              <p className="text-xs text-muted">{c.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{c.value}</p>
            </div>
          );
          return c.href ? (
            <Link key={c.label} href={c.href}>
              {inner}
            </Link>
          ) : (
            <div key={c.label}>{inner}</div>
          );
        })}
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Plats les plus regardés</h2>
          <Link href="/dashboard/stats" className="text-sm text-brand">
            Voir tout
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl bg-surface">
          {topViewed.map((d, i) => (
            <div
              key={d.dishId}
              className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-0"
            >
              <span className="flex items-center gap-3">
                <span className="text-sm text-muted tabular-nums">{i + 1}</span>
                <span className="font-medium">{d.name}</span>
              </span>
              <span className="flex items-center gap-4 text-sm text-muted">
                <span>{d.views} vues</span>
                <span className="tabular-nums text-brand">{d.conversion}% conv.</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/menu"
          className="rounded-xl bg-brand px-5 py-3 font-medium text-white"
        >
          Gérer mon menu
        </Link>
        <Link
          href="/dashboard/tables"
          className="rounded-xl bg-surface px-5 py-3 font-medium"
        >
          Mes QR codes
        </Link>
        <Link
          href="/dashboard/fidelite"
          className="rounded-xl bg-surface px-5 py-3 font-medium"
        >
          🎟️ Fidélité
        </Link>
      </div>
    </div>
  );
}
