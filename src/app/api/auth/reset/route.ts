import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

// POST /api/auth/reset { token, password } — définit un nouveau mot de passe.
export async function POST(req: NextRequest) {
  const { token, password } = await req
    .json()
    .catch(() => ({ token: "", password: "" }));

  if (!token || typeof password !== "string" || password.length < 6) {
    return NextResponse.json(
      { error: "Mot de passe invalide (6 caractères minimum)." },
      { status: 400 }
    );
  }

  const tokenHash = createHash("sha256").update(String(token)).digest("hex");
  const user = await db.user.findFirst({
    where: {
      resetTokenHash: tokenHash,
      resetTokenExpiry: { gt: new Date() },
    },
  });
  if (!user) {
    return NextResponse.json(
      { error: "Lien invalide ou expiré. Refaites une demande." },
      { status: 400 }
    );
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(password, 10),
      resetTokenHash: null,
      resetTokenExpiry: null,
    },
  });

  return NextResponse.json({ ok: true });
}
