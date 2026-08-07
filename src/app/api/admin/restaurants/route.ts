import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { provisionRestaurant } from "@/lib/onboarding";
import { isPlan } from "@/lib/billing";
import { validatePassword } from "@/lib/password";

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

  if (!name || !ownerEmail) {
    return NextResponse.json(
      { error: "Nom et email requis." },
      { status: 400 }
    );
  }
  const pw = validatePassword(ownerPassword);
  if (!pw.ok) {
    return NextResponse.json({ error: pw.error }, { status: 400 });
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
