import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { vatBreakdown } from "@/lib/vat";

// POST /api/caisse/pay/[id] — encaisser une commande de table existante.
// Marque la commande payée (espèces/carte), applique remise/pourboire éventuels.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.rid || session.role === "KITCHEN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const paymentMethod = ["CARD", "MOBILE"].includes(body.paymentMethod)
    ? body.paymentMethod
    : "CASH";
  const amountReceivedCents = Math.max(0, Math.round(Number(body.amountReceivedCents) || 0));
  const tipCents = Math.max(0, Math.round(Number(body.tipCents) || 0));
  const discountPct = Math.min(100, Math.max(0, Math.round(Number(body.discountPct) || 0)));

  const order = await db.order.findFirst({
    where: { id, restaurantId: session.rid },
    include: { items: { include: { dish: true } }, table: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }
  if (order.paid) {
    return NextResponse.json({ error: "Commande déjà réglée" }, { status: 409 });
  }

  // TVA : figer le taux sur chaque ligne (les commandes QR n'en avaient pas).
  const restaurant = await db.restaurant.findUnique({
    where: { id: session.rid },
    select: { vatPermille: true },
  });
  const defaultVat = restaurant?.vatPermille ?? 0;
  const vatByItem = new Map(
    order.items.map((i) => [
      i.id,
      i.vatPermille > 0 ? i.vatPermille : i.dish?.vatPermille ?? defaultVat,
    ])
  );
  await Promise.all(
    order.items
      .filter((i) => (vatByItem.get(i.id) ?? 0) !== i.vatPermille)
      .map((i) =>
        db.orderItem.update({
          where: { id: i.id },
          data: { vatPermille: vatByItem.get(i.id) ?? 0 },
        })
      )
  );

  // Le sous-total vient des articles figés à la commande (jamais du client).
  const subtotalCents = order.items.reduce(
    (s, i) => s + i.unitPriceCents * i.quantity,
    0
  );
  const discountCents = Math.round((subtotalCents * discountPct) / 100);
  const totalCents = subtotalCents - discountCents;
  const dueCents = totalCents + tipCents;
  const changeCents =
    paymentMethod === "CASH" && amountReceivedCents > dueCents
      ? amountReceivedCents - dueCents
      : 0;

  const updated = await db.order.update({
    where: { id: order.id },
    data: {
      status: "SERVED",
      totalCents,
      tipCents,
      discountCents,
      paid: true,
      paidAt: new Date(),
      paymentMethod,
    },
  });

  const vat = vatBreakdown(
    order.items.map((i) => ({
      amountCents: i.unitPriceCents * i.quantity,
      vatPermille: vatByItem.get(i.id) ?? 0,
    })),
    discountCents
  );

  return NextResponse.json({
    orderId: updated.id,
    tableNumber: order.table?.number ?? null,
    subtotalCents,
    discountCents,
    tipCents,
    totalCents,
    dueCents,
    vat,
    paymentMethod,
    amountReceivedCents,
    changeCents,
    createdAt: updated.createdAt,
    items: order.items.map((i) => ({
      name: i.nameSnapshot,
      quantity: i.quantity,
      unitPriceCents: i.unitPriceCents,
      optionsText: i.optionsText,
    })),
  });
}
