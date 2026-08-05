import { requireStaff } from "@/lib/require-owner";
import { db } from "@/lib/db";
import { can } from "@/lib/plan";
import { DishForm } from "@/components/dashboard/DishForm";

export default async function NewDishPage() {
  const { restaurant } = await requireStaff();
  const categories = await db.category.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { position: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">Nouveau plat</h1>
      <DishForm
        mode="new"
        categories={categories}
        hasVideo={can(restaurant.plan, "video")}
      />
    </div>
  );
}
