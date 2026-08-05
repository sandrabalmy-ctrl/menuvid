import { requireStaff } from "@/lib/require-owner";
import { OrdersBoard } from "@/components/dashboard/OrdersBoard";
import { EtaControl } from "@/components/dashboard/EtaControl";

export default async function OrdersPage() {
  const { restaurant } = await requireStaff();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Commandes</h1>
        <p className="text-sm text-muted">
          Mises à jour automatiquement. Faites avancer chaque commande d’un tap.
        </p>
      </div>
      <EtaControl />
      <OrdersBoard currency={restaurant.currency} />
    </div>
  );
}
