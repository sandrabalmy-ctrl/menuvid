import { requireStaff } from "@/lib/require-owner";
import { db } from "@/lib/db";
import { CaisseScreen } from "@/components/dashboard/CaisseScreen";

export default async function CaissePage() {
  const { session, restaurant } = await requireStaff();
  const categories = await db.category.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { position: "asc" },
    include: {
      dishes: {
        where: { available: true },
        orderBy: { position: "asc" },
        select: { id: true, name: true, priceCents: true },
      },
    },
  });

  return (
    <CaisseScreen
      currency={restaurant.currency}
      restaurantName={restaurant.name}
      vatPermille={restaurant.vatPermille}
      isOwner={session.role === "OWNER"}
      categories={categories
        .filter((c) => c.dishes.length > 0)
        .map((c) => ({ id: c.id, name: c.name, dishes: c.dishes }))}
    />
  );
}
