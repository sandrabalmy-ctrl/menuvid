import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { isStripeConfigured, stripe } from "@/lib/stripe";
import { applyPlan, isPlan } from "@/lib/billing";
import { addSessionPayment } from "@/lib/session";

// POST /api/stripe/webhook — Stripe nous notifie des paiements/résiliations.
// Vérifie la signature puis met à jour le palier du restaurant en base.
export async function POST(req: NextRequest) {
  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe non configuré" }, { status: 400 });
  }

  const body = await req.text(); // corps brut requis pour vérifier la signature
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;

      // Paiement d'une commande convive
      if (s.metadata?.type === "order" && s.metadata?.orderId) {
        await db.order.update({
          where: { id: s.metadata.orderId },
          data: { paid: true, paidAt: new Date() },
        });
        break;
      }

      // Paiement d'une addition de table (tout ou une part)
      if (s.metadata?.type === "session_pay" && s.metadata?.sessionId) {
        await addSessionPayment(
          s.metadata.sessionId,
          Number(s.metadata.amount) || 0
        );
        break;
      }

      const restaurantId = s.metadata?.restaurantId;
      const plan = s.metadata?.plan;
      if (restaurantId && isPlan(plan)) {
        await applyPlan(restaurantId, plan, {
          stripeCustomerId: (s.customer as string) ?? undefined,
          stripeSubscriptionId: (s.subscription as string) ?? undefined,
        });
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const restaurantId = sub.metadata?.restaurantId;
      if (restaurantId) {
        // Résiliation : on repasse le restaurant au palier de base + statut suspendu.
        await db.restaurant.update({
          where: { id: restaurantId },
          data: { status: "SUSPENDED" },
        });
        await db.subscription.updateMany({
          where: { restaurantId },
          data: { status: "CANCELLED" },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
