import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isStripeConfigured, stripe } from "@/lib/stripe";
import { sessionSummary, addSessionPayment } from "@/lib/session";

// POST /api/session/pay { sessionId, mode: "full" | "share", parts? }
// Paie toute l'addition de la table, ou une part (division en N).
export async function POST(req: NextRequest) {
  const { sessionId, mode, parts } = await req.json().catch(() => ({}));
  const summary = sessionId ? await sessionSummary(sessionId) : null;
  if (!summary) {
    return NextResponse.json({ error: "Addition introuvable" }, { status: 404 });
  }
  if (summary.remainingCents <= 0) {
    return NextResponse.json({ ...summary, alreadyPaid: true });
  }

  // Montant à régler : tout le reste, ou une part (arrondi au centime supérieur).
  let amount = summary.remainingCents;
  if (mode === "share") {
    const n = Math.max(2, Math.min(10, Math.floor(Number(parts) || 2)));
    amount = Math.min(summary.remainingCents, Math.ceil(summary.totalCents / n));
  }

  const resto = await db.tableSession
    .findUnique({ where: { id: sessionId }, include: { restaurant: true } })
    .then((s) => s?.restaurant);

  // --- Stripe réel -----------------------------------------------------------
  if (isStripeConfigured() && resto) {
    const origin = req.nextUrl.origin;
    const checkout = await stripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: resto.currency.toLowerCase(),
            unit_amount: amount,
            product_data: {
              name:
                mode === "share"
                  ? `Ma part — ${resto.name} (Table ${summary.tableNumber ?? ""})`
                  : `Addition — ${resto.name} (Table ${summary.tableNumber ?? ""})`,
            },
          },
        },
      ],
      metadata: { type: "session_pay", sessionId, amount: String(amount) },
      success_url: `${origin}/r/${resto.slug}/t/${summary.tableNumber ?? 0}?bill=paid`,
      cancel_url: `${origin}/r/${resto.slug}/t/${summary.tableNumber ?? 0}`,
    });
    return NextResponse.json({ url: checkout.url });
  }

  // --- Mode démo -------------------------------------------------------------
  await addSessionPayment(sessionId, amount);
  const updated = await sessionSummary(sessionId);
  return NextResponse.json({ demo: true, paidAmount: amount, ...updated });
}
