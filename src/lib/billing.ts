import { db } from "@/lib/db";
import { PLANS, planPriceCents, type Plan } from "@/lib/plan";

// Applique un palier à un restaurant (met à jour le restaurant + son abonnement).
// Utilisé en mode démo ET par le webhook Stripe quand un paiement est confirmé.
export async function applyPlan(
  restaurantId: string,
  plan: Plan,
  opts?: { stripeCustomerId?: string; stripeSubscriptionId?: string }
) {
  const resto = await db.restaurant.update({
    where: { id: restaurantId },
    data: {
      plan,
      status: "ACTIVE",
      ...(opts?.stripeCustomerId
        ? { stripeCustomerId: opts.stripeCustomerId }
        : {}),
    },
    select: { currency: true },
  });
  const priceCents = planPriceCents(plan, resto.currency);

  await db.subscription.upsert({
    where: { restaurantId },
    create: {
      restaurantId,
      plan,
      priceCents,
      status: "ACTIVE",
      stripeCustomerId: opts?.stripeCustomerId,
      stripeSubscriptionId: opts?.stripeSubscriptionId,
    },
    update: {
      plan,
      priceCents,
      status: "ACTIVE",
      ...(opts?.stripeCustomerId
        ? { stripeCustomerId: opts.stripeCustomerId }
        : {}),
      ...(opts?.stripeSubscriptionId
        ? { stripeSubscriptionId: opts.stripeSubscriptionId }
        : {}),
    },
  });
}

export function isPlan(v: unknown): v is Plan {
  return typeof v === "string" && v in PLANS;
}
