import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCustomerSession } from "@/lib/customer-auth";

// GET /api/loyalty?restaurantId=… — état de la carte de fidélité du client.
export async function GET(req: NextRequest) {
  const restaurantId = req.nextUrl.searchParams.get("restaurantId") ?? "";
  const resto = await db.restaurant.findUnique({ where: { id: restaurantId } });
  if (!resto) {
    return NextResponse.json({ error: "Restaurant introuvable" }, { status: 404 });
  }

  const base = {
    enabled: resto.loyaltyEnabled,
    threshold: resto.loyaltyThreshold,
    reward: resto.loyaltyReward,
  };

  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ ...base, loggedIn: false });
  }

  const membership = await db.loyaltyMembership.findUnique({
    where: {
      customerId_restaurantId: {
        customerId: session.cid,
        restaurantId: resto.id,
      },
    },
  });
  const customer = await db.customer.findUnique({ where: { id: session.cid } });
  const points = membership?.points ?? 0;

  return NextResponse.json({
    ...base,
    loggedIn: true,
    name: customer?.name ?? null,
    email: session.email,
    points,
    rewardReady: resto.loyaltyEnabled && points >= resto.loyaltyThreshold,
  });
}
