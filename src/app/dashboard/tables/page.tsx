import { requireStaff } from "@/lib/require-owner";
import { db } from "@/lib/db";
import { TablesManager } from "@/components/dashboard/TablesManager";

export default async function TablesPage() {
  const { restaurant } = await requireStaff();
  const tables = await db.diningTable.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { number: "asc" },
    select: { id: true, number: true },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Tables & QR codes</h1>
        <p className="text-sm text-muted">
          Chaque QR code ouvre le menu avec la table déjà identifiée. Imprimez-les
          et posez-les sur vos tables.
        </p>
      </div>
      <TablesManager tables={tables} />
    </div>
  );
}
