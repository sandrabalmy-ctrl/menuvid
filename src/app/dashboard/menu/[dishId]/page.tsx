import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/require-owner";
import { db } from "@/lib/db";
import { can } from "@/lib/plan";
import { parseList } from "@/lib/format";
import { parseOptions } from "@/lib/options";
import { DishForm } from "@/components/dashboard/DishForm";

export default async function EditDishPage({
  params,
}: {
  params: Promise<{ dishId: string }>;
}) {
  const { restaurant } = await requireStaff();
  const { dishId } = await params;

  const dish = await db.dish.findFirst({
    where: { id: dishId, restaurantId: restaurant.id }, // isolation multi-tenant
  });
  if (!dish) notFound();

  const categories = await db.category.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { position: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">Modifier le plat</h1>
      <DishForm
        mode="edit"
        categories={categories}
        hasVideo={can(restaurant.plan, "video")}
        initial={{
          id: dish.id,
          name: dish.name,
          nameEn: dish.nameEn ?? "",
          description: dish.description,
          descriptionEn: dish.descriptionEn ?? "",
          priceEuros: (dish.priceCents / 100).toFixed(2),
          categoryId: dish.categoryId,
          photoUrl: dish.photoUrl ?? "",
          videoUrl: dish.videoUrl ?? "",
          badge: dish.badge ?? "",
          options: parseOptions(dish.optionsJson),
          allergens: parseList(dish.allergens),
          diets: parseList(dish.diets),
          available: dish.available,
        }}
      />
    </div>
  );
}
