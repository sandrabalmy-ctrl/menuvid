import { db } from "@/lib/db";
import { PLANS } from "@/lib/plan";

export type RestaurantOverview = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  planLabel: string;
  status: string;
  monthlyCents: number;
  dishes: number;
  orders: number;
  ownerEmail: string | null;
};

// Vue d'ensemble de tous les restaurants clients (pour le super-admin).
export async function getRestaurantsOverview(): Promise<RestaurantOverview[]> {
  const restaurants = await db.restaurant.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { dishes: true, orders: true } },
      users: { where: { role: "OWNER" }, take: 1, select: { email: true } },
      subscription: true,
    },
  });

  return restaurants.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    plan: r.plan,
    planLabel: PLANS[r.plan as keyof typeof PLANS]?.label ?? r.plan,
    status: r.status,
    monthlyCents:
      r.subscription?.priceCents ??
      PLANS[r.plan as keyof typeof PLANS]?.priceCents ??
      0,
    dishes: r._count.dishes,
    orders: r._count.orders,
    ownerEmail: r.users[0]?.email ?? null,
  }));
}

// Revenu récurrent mensuel total (MRR) sur les restaurants actifs.
export async function getMRR(): Promise<number> {
  const list = await getRestaurantsOverview();
  return list
    .filter((r) => r.status === "ACTIVE")
    .reduce((s, r) => s + r.monthlyCents, 0);
}
