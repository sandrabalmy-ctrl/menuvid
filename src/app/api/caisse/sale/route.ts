import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { parseOptions, resolveOptions } from "@/lib/options";
import { vatBreakdown } from "@/lib/vat";

// POST /api/caisse/sale — encaissement au comptoir (vente payée immédiatement).
// Réservé au patron / à la salle (pas la cuisine).
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.rid || session.role === "KITCHEN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const items: {
    dishId: string;
    quantity: number;
    optionChoiceIds?: string[];
  }[] = Array.isArray(body.items) ? body.items : [];
  const paymentMethod = ["CARD", "MOBILE"].includes(body.paymentMethod)
    ? body.paymentMethod
    : "CASH";
  const amountReceivedCents = Math.max(0, Math.round(Number(body.amountReceivedCents) || 0));
  const tipCents = Math.max(0, Math.round(Number(body.tipCents) || 0));
  const discountPct = Math.min(100, Math.max(0, Math.round(Number(body.discountPct) || 0)));

  if (items.length === 0) {
    return NextResponse.json({ error: "Ticket vide" }, { status: 400 });
  }

  // Prix recalculés côté serveur (jamais ceux envoyés par le client).
  const dishIds = [...new Set(items.map((i) => i.dishId))];
  const [dishes, restaurant] = await Promise.all([
    db.dish.findMany({ where: { id: { in: dishIds }, restaurantId: session.rid } }),
    db.restaurant.findUnique({ where: { id: session.rid }, select: { vatPermille: true } }),
  ]);
  const defaultVat = restaurant?.vatPermille ?? 0;
  const byId = new Map(dishes.map((d) => [d.id, d]));

  const lines = [];
  for (const item of items) {
    const dish = byId.get(item.dishId);
    if (!dish) continue;
    const qty = Math.max(1, Math.min(99, Math.floor(item.quantity || 1)));
    const { priceDelta, text } = resolveOptions(
      parseOptions(dish.optionsJson),
      Array.isArray(item.optionChoiceIds) ? item.optionChoiceIds : []
    );
    lines.push({
      dishId: dish.id,
      nameSnapshot: dish.name,
      unitPriceCents: dish.priceCents + priceDelta,
      optionsText: text || null,
      quantity: qty,
      vatPermille: dish.vatPermille ?? defaultVat,
    });
  }
  if (lines.length === 0) {
    return NextResponse.json({ error: "Aucun article valide" }, { status: 400 });
  }

  // Sous-total des articles, puis remise (%) et pourboire.
  const subtotalCents = lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);
  const discountCents = Math.round((subtotalCents * discountPct) / 100);
  const totalCents = subtotalCents - discountCents; // articles après remise
  const dueCents = totalCents + tipCents; // montant réellement encaissé
  const changeCents =
    paymentMethod === "CASH" && amountReceivedCents > dueCents
      ? amountReceivedCents - dueCents
      : 0;

  const order = await db.order.create({
    data: {
      restaurantId: session.rid,
      status: "SERVED",
      totalCents,
      tipCents,
      discountCents,
      paid: true,
      paidAt: new Date(),
      paymentMethod,
      source: "COUNTER",
      items: { create: lines },
    },
    include: { items: true },
  });

  // Analytics (comptabilise ces ventes dans les stats)
  await db.analyticsEvent.createMany({
    data: lines.map((l) => ({ restaurantId: session.rid!, dishId: l.dishId, type: "ORDER" })),
  });

  const vat = vatBreakdown(
    lines.map((l) => ({ amountCents: l.unitPriceCents * l.quantity, vatPermille: l.vatPermille })),
    discountCents
  );

  return NextResponse.json({
    orderId: order.id,
    subtotalCents,
    discountCents,
    tipCents,
    totalCents,
    dueCents,
    vat,
    paymentMethod,
    amountReceivedCents,
    changeCents,
    createdAt: order.createdAt,
    items: order.items.map((i) => ({
      name: i.nameSnapshot,
      quantity: i.quantity,
      unitPriceCents: i.unitPriceCents,
      optionsText: i.optionsText,
    })),
  });
}
