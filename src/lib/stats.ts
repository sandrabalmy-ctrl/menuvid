import { db } from "@/lib/db";

// Bornes de la journée courante (pour "CA du jour", "commandes du jour").
function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export type DishStat = {
  dishId: string;
  name: string;
  views: number; // vues vidéo
  addToCart: number; // ajouts au panier
  orders: number; // commandes
  conversion: number; // vue vidéo → commande (%)
};

/** Chiffres clés du tableau de bord (journée en cours). */
export async function getDashboard(restaurantId: string) {
  const since = startOfToday();

  const [ordersToday, activeOrders, dishesCount, events] = await Promise.all([
    db.order.findMany({
      where: { restaurantId, createdAt: { gte: since } },
      select: { totalCents: true },
    }),
    db.order.count({
      where: { restaurantId, status: { in: ["RECEIVED", "PREPARING", "READY"] } },
    }),
    db.dish.count({ where: { restaurantId } }),
    db.analyticsEvent.groupBy({
      by: ["type"],
      where: { restaurantId, createdAt: { gte: since } },
      _count: { _all: true },
    }),
  ]);

  const revenueToday = ordersToday.reduce((s, o) => s + o.totalCents, 0);
  const countToday = ordersToday.length;
  const avgBasket = countToday ? Math.round(revenueToday / countToday) : 0;
  const totalViews =
    events.find((e) => e.type === "VIDEO_VIEW")?._count._all ?? 0;

  return {
    revenueToday,
    countToday,
    activeOrders,
    dishesCount,
    avgBasket,
    totalViews,
  };
}

/** Statistiques détaillées par plat (vues, conversion, etc.). */
export async function getDishStats(restaurantId: string): Promise<DishStat[]> {
  const [dishes, grouped] = await Promise.all([
    db.dish.findMany({
      where: { restaurantId },
      select: { id: true, name: true },
    }),
    db.analyticsEvent.groupBy({
      by: ["dishId", "type"],
      where: { restaurantId, dishId: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const map = new Map<string, DishStat>();
  for (const d of dishes) {
    map.set(d.id, {
      dishId: d.id,
      name: d.name,
      views: 0,
      addToCart: 0,
      orders: 0,
      conversion: 0,
    });
  }
  for (const g of grouped) {
    if (!g.dishId) continue;
    const s = map.get(g.dishId);
    if (!s) continue;
    const n = g._count._all;
    if (g.type === "VIDEO_VIEW") s.views += n;
    else if (g.type === "ADD_TO_CART") s.addToCart += n;
    else if (g.type === "ORDER") s.orders += n;
  }
  const list = [...map.values()];
  for (const s of list) {
    s.conversion = s.views ? Math.round((s.orders / s.views) * 100) : 0;
  }
  // Les plus vus en premier
  return list.sort((a, b) => b.views - a.views);
}
