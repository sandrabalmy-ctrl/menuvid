import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isStripeConfigured, stripe } from "@/lib/stripe";

// POST /api/pay { orderId } — le convive paie sa commande en ligne.
// Sans clé Stripe (démo) : le paiement est simulé (commande marquée payée).
// Avec Stripe : ouvre un paiement sécurisé (carte / Apple Pay).
export async function POST(req: NextRequest) {
  const { orderId } = await req.json().catch(() => ({}));
  if (!orderId) {
    return NextResponse.json({ error: "Commande manquante" }, { status: 400 });
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { restaurant: true, table: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }
  if (order.paid) {
    return NextResponse.json({ paid: true });
  }

  const amount = order.totalCents + order.tipCents;
  if (amount <= 0) {
    return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
  }

  // --- Mode démo (pas de clé Stripe) : on marque payé directement -----------
  if (!isStripeConfigured()) {
    await db.order.update({
      where: { id: order.id },
      data: { paid: true, paidAt: new Date() },
    });
    return NextResponse.json({ demo: true, paid: true });
  }

  // --- Mode réel : paiement Stripe ------------------------------------------
  const origin = req.nextUrl.origin;
  const statusPath = `/r/${order.restaurant.slug}/t/${order.table?.number ?? 0}/commande/${order.id}`;

  const checkout = await stripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: order.restaurant.currency.toLowerCase(),
          unit_amount: amount,
          product_data: { name: `Commande — ${order.restaurant.name}` },
        },
      },
    ],
    metadata: { orderId: order.id, type: "order" },
    success_url: `${origin}${statusPath}?paid=1`,
    cancel_url: `${origin}${statusPath}`,
  });

  await db.order.update({
    where: { id: order.id },
    data: { stripeSessionId: checkout.id },
  });
  return NextResponse.json({ url: checkout.url });
}
