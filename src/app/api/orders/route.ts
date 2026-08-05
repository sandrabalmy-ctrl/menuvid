import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { can } from "@/lib/plan";
import { getCustomerSession } from "@/lib/customer-auth";
import { parseOptions, resolveOptions } from "@/lib/options";
import { parseSteps, resolveFormule } from "@/lib/formules";
import { getOrCreateOpenSession } from "@/lib/session";

// POST /api/orders — le convive envoie sa commande en cuisine.
// ⚠️ Sécurité : on ne fait JAMAIS confiance aux prix envoyés par le téléphone.
// On recalcule tout côté serveur à partir de la base.
export async function POST(req: NextRequest) {
  let body: {
    restaurantId?: string;
    tableNumber?: number | null;
    tipCents?: number;
    items?: {
      dishId?: string;
      formuleId?: string;
      choiceDishIds?: string[]; // formule : un plat choisi par étape
      quantity: number;
      note?: string;
      optionChoiceIds?: string[];
    }[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const { restaurantId, tableNumber } = body;
  const items = body.items ?? [];
  if (!restaurantId || items.length === 0) {
    return NextResponse.json({ error: "Commande vide" }, { status: 400 });
  }

  const resto = await db.restaurant.findUnique({ where: { id: restaurantId } });
  if (!resto) {
    return NextResponse.json({ error: "Restaurant introuvable" }, { status: 404 });
  }
  // Verrou de palier : commande interdite si l'abonnement ne l'inclut pas.
  if (!can(resto.plan, "ordering")) {
    return NextResponse.json(
      { error: "La commande n'est pas activée pour ce restaurant" },
      { status: 403 }
    );
  }
  if (resto.orderingPaused) {
    return NextResponse.json(
      { error: "Les commandes sont fermées pour le moment." },
      { status: 403 }
    );
  }

  // On ne charge que les données de CE restaurant (isolation multi-tenant).
  // On rassemble les ids de plats des lignes plat ET des choix de formule.
  const dishIds = [
    ...new Set(
      items.flatMap((i) => [
        ...(i.dishId ? [i.dishId] : []),
        ...(Array.isArray(i.choiceDishIds) ? i.choiceDishIds : []),
      ])
    ),
  ];
  const formuleIds = [
    ...new Set(items.map((i) => i.formuleId).filter((x): x is string => !!x)),
  ];

  const [dishes, formules] = await Promise.all([
    dishIds.length
      ? db.dish.findMany({ where: { id: { in: dishIds }, restaurantId } })
      : Promise.resolve([]),
    formuleIds.length
      ? db.formule.findMany({ where: { id: { in: formuleIds }, restaurantId } })
      : Promise.resolve([]),
  ]);
  const byId = new Map(dishes.map((d) => [d.id, d]));
  const formuleById = new Map(formules.map((f) => [f.id, f]));

  // Chaque ligne stockée + les plats à comptabiliser en analytics.
  const lines: {
    dishId: string | null;
    formuleId: string | null;
    nameSnapshot: string;
    unitPriceCents: number;
    optionsText: string | null;
    quantity: number;
    note?: string;
  }[] = [];
  const analyticsDishIds: string[] = [];

  // Construit les lignes à partir des prix RÉELS en base.
  for (const item of items) {
    const qty = Math.max(1, Math.min(99, Math.floor(item.quantity || 1)));

    // ---- Ligne FORMULE (menu à prix fixe) --------------------------------
    if (item.formuleId) {
      const formule = formuleById.get(item.formuleId);
      if (!formule || !formule.available) continue;
      const steps = parseSteps(formule.stepsJson);
      const chosen = Array.isArray(item.choiceDishIds) ? item.choiceDishIds : [];
      // Valide qu'un plat DISPO est choisi par étape (sinon on ignore la ligne).
      const { valid, text } = resolveFormule(steps, chosen, (id) => {
        const d = byId.get(id);
        return d && d.available ? d.name : null;
      });
      if (!valid) continue;
      lines.push({
        dishId: null,
        formuleId: formule.id,
        nameSnapshot: formule.name,
        unitPriceCents: formule.priceCents, // prix fixe, jamais celui du téléphone
        optionsText: text,
        quantity: qty,
        note: item.note?.slice(0, 200),
      });
      chosen.forEach((id) => analyticsDishIds.push(id));
      continue;
    }

    // ---- Ligne PLAT ------------------------------------------------------
    const dish = item.dishId ? byId.get(item.dishId) : undefined;
    if (!dish || !dish.available) continue; // ignore plat inconnu / indispo

    // Recalcul SÉCURISÉ du supplément d'options à partir de la base
    // (on ne fait jamais confiance au prix envoyé par le téléphone).
    const groups = parseOptions(dish.optionsJson);
    const { priceDelta, text } = resolveOptions(
      groups,
      Array.isArray(item.optionChoiceIds) ? item.optionChoiceIds : []
    );

    lines.push({
      dishId: dish.id,
      formuleId: null,
      nameSnapshot: dish.name,
      unitPriceCents: dish.priceCents + priceDelta,
      optionsText: text || null,
      quantity: qty,
      note: item.note?.slice(0, 200),
    });
    analyticsDishIds.push(dish.id);
  }
  if (lines.length === 0) {
    return NextResponse.json(
      { error: "Aucun plat disponible dans la commande" },
      { status: 400 }
    );
  }

  const totalCents = lines.reduce(
    (s, l) => s + l.unitPriceCents * l.quantity,
    0
  );

  // Résout la table par son numéro (pré-rempli via le QR code).
  let tableId: string | null = null;
  if (tableNumber != null) {
    const t = await db.diningTable.findUnique({
      where: { restaurantId_number: { restaurantId, number: tableNumber } },
    });
    tableId = t?.id ?? null;
  }

  // Pourboire : borné entre 0 et le montant de la commande (sécurité).
  const tipCents = Math.max(
    0,
    Math.min(totalCents, Math.round(Number(body.tipCents) || 0))
  );

  // Client fidélité connecté ? On rattache la commande et on ajoute un point.
  const customerSession = await getCustomerSession();
  const customerId = customerSession?.cid ?? null;

  // Session de table : la tournée rejoint l'addition ouverte de la table.
  const tableSession = await getOrCreateOpenSession(restaurantId, tableNumber ?? null);

  const order = await db.order.create({
    data: {
      restaurantId,
      tableId,
      status: "RECEIVED",
      totalCents,
      tipCents,
      etaMinutes: resto.prepEtaMinutes, // temps d'attente figé au moment de la commande
      customerId,
      sessionId: tableSession?.id ?? null,
      items: { create: lines },
    },
  });

  if (customerId && resto.loyaltyEnabled) {
    await db.loyaltyMembership.upsert({
      where: { customerId_restaurantId: { customerId, restaurantId } },
      create: { customerId, restaurantId, points: 1 },
      update: { points: { increment: 1 } },
    });
  }

  // Analytics : une commande de plus (par plat, formules incluses via leurs choix)
  if (analyticsDishIds.length) {
    await db.analyticsEvent.createMany({
      data: analyticsDishIds.map((dishId) => ({
        restaurantId,
        dishId,
        type: "ORDER",
      })),
    });
  }

  return NextResponse.json({ orderId: order.id });
}
