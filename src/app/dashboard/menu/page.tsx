import Link from "next/link";
import { requireStaff } from "@/lib/require-owner";
import { db } from "@/lib/db";
import { MenuManager } from "@/components/dashboard/MenuManager";
import { CategoryManager } from "@/components/dashboard/CategoryManager";

export default async function MenuPage() {
  const { restaurant } = await requireStaff();
  const categories = await db.category.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { position: "asc" },
    include: { dishes: { orderBy: { position: "asc" } } },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mon menu</h1>
        <Link
          href="/dashboard/menu/nouveau"
          className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
        >
          + Ajouter un plat
        </Link>
      </div>
      <CategoryManager
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          nameEn: c.nameEn,
          dishCount: c.dishes.length,
        }))}
      />

      <MenuManager
        currency={restaurant.currency}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          dishes: c.dishes.map((d) => ({
            id: d.id,
            name: d.name,
            priceCents: d.priceCents,
            photoUrl: d.photoUrl,
            videoUrl: d.videoUrl,
            available: d.available,
          })),
        }))}
      />
    </div>
  );
}
