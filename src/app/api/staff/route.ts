import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { validatePassword } from "@/lib/password";

// POST /api/staff — le propriétaire crée un compte pour un membre de l'équipe.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session?.role !== "OWNER" || !session.rid) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { email, password, role } = await req.json().catch(() => ({}));
  const cleanEmail = String(email ?? "").toLowerCase().trim();
  const r = role === "KITCHEN" ? "KITCHEN" : "STAFF";

  if (!cleanEmail) {
    return NextResponse.json({ error: "Email requis." }, { status: 400 });
  }
  const pw = validatePassword(password);
  if (!pw.ok) {
    return NextResponse.json({ error: pw.error }, { status: 400 });
  }
  const exists = await db.user.findUnique({ where: { email: cleanEmail } });
  if (exists) {
    return NextResponse.json(
      { error: "Cet email est déjà utilisé." },
      { status: 400 }
    );
  }

  await db.user.create({
    data: {
      restaurantId: session.rid,
      email: cleanEmail,
      passwordHash: await bcrypt.hash(password, 12),
      role: r,
    },
  });
  return NextResponse.json({ ok: true });
}
