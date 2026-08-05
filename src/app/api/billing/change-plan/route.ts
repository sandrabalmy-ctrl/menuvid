import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PLANS, type Plan } from "@/lib/plan";
import { applyPlan, isPlan } from "@/lib/billing";
import { isStripeConfigured, stripe } from "@/lib/stripe";

// POST /api/billing/change-plan { plan } — le restaurateur change de palier.
export async function POST(req: NextRequest) {
  const session = await getSession();
  // Facturation : réservé au propriétaire (pas la salle ni la cuisine).
  if (session?.role !== "OWNER" || !session.rid) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { plan } = await req.json().catch(() => ({ plan: undefined }));
  if (!isPlan(plan)) {
    return NextResponse.json({ error: "Palier invalide" }, { status: 400 });
  }

  const resto = await db.restaurant.findUnique({ where: { id: session.rid } });
  if (!resto) {
    return NextResponse.json({ error: "Restaurant introuvable" }, { status: 404 });
  }

  // --- Mode démo (pas de clé Stripe) : on applique directement le palier ------
  if (!isStripeConfigured()) {
    await applyPlan(resto.id, plan as Plan);
    return NextResponse.json({ demo: true, plan });
  }

  // --- Mode réel : on ouvre un paiement Stripe (abonnement mensuel) -----------
  const origin = req.nextUrl.origin;
  const s = stripe();

  // Réutilise le client Stripe existant, sinon en crée un.
  let customerId = resto.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await s.customers.create({ name: resto.name });
    customerId = customer.id;
    await db.restaurant.update({
      where: { id: resto.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkout = await s.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          recurring: { interval: "month" },
          unit_amount: PLANS[plan as Plan].priceCents,
          product_data: { name: `MenuVid — palier ${PLANS[plan as Plan].label}` },
        },
      },
    ],
    // On mémorise quel palier acheter pour le webhook.
    metadata: { restaurantId: resto.id, plan },
    subscription_data: { metadata: { restaurantId: resto.id, plan } },
    success_url: `${origin}/dashboard/abonnement?success=1`,
    cancel_url: `${origin}/dashboard/abonnement?canceled=1`,
  });

  return NextResponse.json({ url: checkout.url });
}
