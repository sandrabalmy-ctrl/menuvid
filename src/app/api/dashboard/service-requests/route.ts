import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/dashboard/service-requests — demandes en attente du restaurant connecté.
export async function GET() {
  const session = await getSession();
  if (!session?.rid) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const requests = await db.serviceRequest.findMany({
    where: { restaurantId: session.rid, resolved: false },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({
    requests: requests.map((r) => ({
      id: r.id,
      tableNumber: r.tableNumber,
      type: r.type,
      createdAt: r.createdAt,
    })),
  });
}
