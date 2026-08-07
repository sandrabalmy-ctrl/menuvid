import { requireOwner } from "@/lib/require-owner";
import { isStripeConfigured } from "@/lib/stripe";
import { PLANS, planPriceCents, type Plan } from "@/lib/plan";
import { formatPrice } from "@/lib/format";
import { PlanSelector } from "@/components/dashboard/PlanSelector";

export default async function BillingPage() {
  const { restaurant } = await requireOwner();
  const priceCents = planPriceCents(restaurant.plan as Plan, restaurant.currency);

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Abonnement</h1>
        <p className="text-sm text-muted">
          Palier actuel :{" "}
          <span className="font-medium text-text">
            {PLANS[restaurant.plan as keyof typeof PLANS]?.label ?? restaurant.plan}
          </span>{" "}
          · {formatPrice(priceCents, restaurant.currency)}/mois
        </p>
      </div>

      {!isStripeConfigured() && (
        <p className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Mode démo : les changements de palier s’appliquent immédiatement, sans
          paiement réel. La facturation Stripe s’activera en ligne avec une clé
          d’API.
        </p>
      )}

      <PlanSelector currentPlan={restaurant.plan} currency={restaurant.currency} />
    </div>
  );
}
