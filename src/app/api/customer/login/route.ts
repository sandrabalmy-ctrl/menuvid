import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createCustomerSession } from "@/lib/customer-auth";
import { checkRateLimit, clearRateLimit } from "@/lib/rate-limit";

// POST /api/customer/login — connexion d'un client fidélité.
export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}));
  const cleanEmail = String(email ?? "").toLowerCase().trim();
  if (!cleanEmail || !password) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = `clogin:${ip}:${cleanEmail}`;
  const rl = checkRateLimit(key);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Trop de tentatives. Réessayez dans ${Math.ceil(rl.retryInSec / 60)} min.` },
      { status: 429 }
    );
  }

  const customer = await db.customer.findUnique({ where: { email: cleanEmail } });
  const ok = customer && (await bcrypt.compare(password, customer.passwordHash));
  if (!customer || !ok) {
    return NextResponse.json(
      { error: "Email ou mot de passe incorrect" },
      { status: 401 }
    );
  }

  clearRateLimit(key);
  await createCustomerSession({ cid: customer.id, email: customer.email });
  return NextResponse.json({ ok: true, name: customer.name });
}
