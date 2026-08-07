import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { checkRateLimit, clearRateLimit } from "@/lib/rate-limit";

// POST /api/auth/login — connexion du restaurateur.
export async function POST(req: NextRequest) {
  const { email, password } = await req
    .json()
    .catch(() => ({ email: "", password: "" }));

  if (!email || !password) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  const cleanEmail = String(email).toLowerCase().trim();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = `login:${ip}:${cleanEmail}`;

  // Anti-force brute : 5 tentatives / 15 min.
  const rl = checkRateLimit(key);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: `Trop de tentatives. Réessayez dans ${Math.ceil(rl.retryInSec / 60)} min.`,
      },
      { status: 429 }
    );
  }

  const user = await db.user.findUnique({ where: { email: cleanEmail } });
  // Message générique (ne révèle pas si l'email existe)
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!user || !ok) {
    return NextResponse.json(
      { error: "Email ou mot de passe incorrect" },
      { status: 401 }
    );
  }

  clearRateLimit(key); // connexion réussie → on remet le compteur à zéro

  await createSession({
    uid: user.id,
    rid: user.restaurantId ?? null,
    role: user.role,
    ep: user.sessionEpoch,
  });
  return NextResponse.json({ ok: true, role: user.role });
}
