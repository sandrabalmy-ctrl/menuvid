import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isStripeConfigured, stripe } from "@/lib/stripe";

// POST /api/billing/portal — ouvre le portail de facturation Stripe
// (le restaurateur y gère sa carte, ses factures, résilie…).
export async function POST(req: NextRequest) {
  const session = await getSession();
  // Portail de facturation Stripe : réservé au propriétaire.
  if (session?.role !== "OWNER" || !session.rid) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { demo: true, error: "Portail disponible une fois Stripe activé." },
      { status: 200 }
    );
  }

  const resto = await db.restaurant.findUnique({ where: { id: session.rid } });
  if (!resto?.stripeCustomerId) {
    return NextResponse.json(
      { error: "Aucun abonnement Stripe actif." },
      { status: 400 }
    );
  }

  const portal = await stripe().billingPortal.sessions.create({
    customer: resto.stripeCustomerId,
    return_url: `${req.nextUrl.origin}/dashboard/abonnement`,
  });
  return NextResponse.json({ url: portal.url });
}
