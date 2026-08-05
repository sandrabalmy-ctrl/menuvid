import { requireStaff } from "@/lib/require-owner";
import { db } from "@/lib/db";
import { FormuleManager } from "@/components/dashboard/FormuleManager";

export default async function FormulesPage() {
  const { restaurant } = await requireStaff();

  const [formules, categories] = await Promise.all([
    db.formule.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { position: "asc" },
    }),
    db.category.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { position: "asc" },
      include: {
        dishes: {
          orderBy: { position: "asc" },
          select: { id: true, name: true, priceCents: true },
        },
      },
    }),
  ]);

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Formules</h1>
        <p className="text-sm text-muted">
          Créez des menus à prix fixe (ex. entrée + plat + dessert). Le client
          choisit un plat par étape et paie le prix de la formule.
        </p>
      </div>
      <FormuleManager
        currency={restaurant.currency}
        formules={formules.map((f) => ({
          id: f.id,
          name: f.name,
          nameEn: f.nameEn,
          description: f.description,
          descriptionEn: f.descriptionEn,
          priceCents: f.priceCents,
          stepsJson: f.stepsJson,
          available: f.available,
        }))}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          dishes: c.dishes,
        }))}
      />
    </div>
  );
}
