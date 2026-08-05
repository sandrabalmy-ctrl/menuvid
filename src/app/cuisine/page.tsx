import { requireKitchen } from "@/lib/require-owner";
import { KitchenDisplay } from "@/components/dashboard/KitchenDisplay";
import { EtaControl } from "@/components/dashboard/EtaControl";
import { LogoutButton } from "@/components/dashboard/LogoutButton";

// Écran cuisine plein écran : accessible cuisine, salle et propriétaire.
export default async function CuisinePage() {
  const { restaurant } = await requireKitchen();
  return (
    <div className="min-h-screen bg-bg px-4 py-4">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black">🍳 Cuisine — {restaurant.name}</h1>
          <p className="text-sm text-muted">
            Actualisation automatique. Tapez une commande pour la faire avancer.
          </p>
        </div>
        <LogoutButton />
      </header>
      <div className="mb-4">
        <EtaControl compact />
      </div>
      <KitchenDisplay />
    </div>
  );
}
