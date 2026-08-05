import { requireOwner } from "@/lib/require-owner";
import { db } from "@/lib/db";
import { StaffManager } from "@/components/dashboard/StaffManager";

export default async function EquipePage() {
  const { restaurant } = await requireOwner();
  const members = await db.user.findMany({
    where: { restaurantId: restaurant.id, role: { in: ["STAFF", "KITCHEN"] } },
    orderBy: { email: "asc" },
    select: { id: true, email: true, role: true },
  });

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Équipe</h1>
        <p className="text-sm text-muted">
          Créez des accès pour votre personnel. <strong>Salle</strong> : commandes,
          menu, tables et stats. <strong>Cuisine</strong> : uniquement l’écran cuisine
          (pas d’accès aux réglages ni au chiffre d’affaires).
        </p>
      </div>
      <StaffManager members={members} />
    </div>
  );
}
