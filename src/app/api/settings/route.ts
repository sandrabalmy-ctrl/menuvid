import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { THEMES } from "@/lib/themes";
import { parsePrizes } from "@/lib/gift";

// PATCH /api/settings — le restaurateur modifie l'apparence de son menu
// (fond / thème, couleur d'accent).
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  // Réglages du restaurant : réservé au propriétaire (pas salle/cuisine).
  if (session?.role !== "OWNER" || !session.rid) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const data: {
    theme?: string;
    brandColor?: string;
    welcomeMessage?: string | null;
    reviewGiftEnabled?: boolean;
    googleReviewUrl?: string | null;
    reviewPrizes?: string;
    tipEnabled?: boolean;
    onlinePaymentEnabled?: boolean;
    orderingPaused?: boolean;
    offerEnglish?: boolean;
    welcomeMessageEn?: string | null;
    loyaltyEnabled?: boolean;
    loyaltyThreshold?: number;
    loyaltyReward?: string;
  } = {};

  if (typeof body.loyaltyEnabled === "boolean") {
    data.loyaltyEnabled = body.loyaltyEnabled;
  }
  if (body.loyaltyThreshold !== undefined) {
    const n = Math.round(Number(body.loyaltyThreshold));
    if (n >= 1 && n <= 100) data.loyaltyThreshold = n;
  }
  if (typeof body.loyaltyReward === "string" && body.loyaltyReward.trim()) {
    data.loyaltyReward = body.loyaltyReward.trim().slice(0, 80);
  }

  if (typeof body.tipEnabled === "boolean") {
    data.tipEnabled = body.tipEnabled;
  }
  if (typeof body.onlinePaymentEnabled === "boolean") {
    data.onlinePaymentEnabled = body.onlinePaymentEnabled;
  }
  if (typeof body.orderingPaused === "boolean") {
    data.orderingPaused = body.orderingPaused;
  }
  if (typeof body.offerEnglish === "boolean") {
    data.offerEnglish = body.offerEnglish;
  }
  if (typeof body.welcomeMessageEn === "string") {
    const msg = body.welcomeMessageEn.trim().slice(0, 400);
    data.welcomeMessageEn = msg.length > 0 ? msg : null;
  }

  if (typeof body.theme === "string" && body.theme in THEMES) {
    data.theme = body.theme;
  }
  if (
    typeof body.brandColor === "string" &&
    /^#[0-9a-fA-F]{6}$/.test(body.brandColor)
  ) {
    data.brandColor = body.brandColor;
  }
  if (typeof body.welcomeMessage === "string") {
    const msg = body.welcomeMessage.trim().slice(0, 400);
    data.welcomeMessage = msg.length > 0 ? msg : null; // vide = pas d'encadré
  }

  // --- Roue des cadeaux ---
  if (typeof body.reviewGiftEnabled === "boolean") {
    data.reviewGiftEnabled = body.reviewGiftEnabled;
  }
  if (typeof body.googleReviewUrl === "string") {
    const u = body.googleReviewUrl.trim();
    data.googleReviewUrl = u.length > 0 ? u.slice(0, 500) : null;
  }
  if (Array.isArray(body.reviewPrizes)) {
    // On revalide via parsePrizes (nettoie labels + poids) puis on re-sérialise.
    const clean = parsePrizes(JSON.stringify(body.reviewPrizes));
    data.reviewPrizes = JSON.stringify(clean);
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Rien à modifier" }, { status: 400 });
  }

  await db.restaurant.update({ where: { id: session.rid }, data });
  return NextResponse.json({ ok: true });
}
