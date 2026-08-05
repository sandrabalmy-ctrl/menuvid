import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { provisionRestaurant } from "@/lib/onboarding";
import { isPlan } from "@/lib/billing";

// POST /api/admin/restaurants — crée un nouveau restaurant client (onboarding).
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session?.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const ownerEmail = String(body.ownerEmail ?? "").trim();
  const ownerPassword = String(body.ownerPassword ?? "");
  const plan = isPlan(body.plan) ? body.plan : "VIDEO";

  if (!name || !ownerEmail || ownerPassword.length < 6) {
    return NextResponse.json(
      { error: "Nom, email et mot de passe (6+ caractères) requis." },
      { status: 400 }
    );
  }
  const exists = await db.user.findUnique({
    where: { email: ownerEmail.toLowerCase() },
  });
  if (exists) {
    return NextResponse.json(
      { error: "Cet email est déjà utilisé." },
      { status: 400 }
    );
  }

  const resto = await provisionRestaurant({
    name,
    ownerEmail,
    ownerPassword,
    plan,
  });
  return NextResponse.json({ id: resto.id, slug: resto.slug });
}
