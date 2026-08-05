import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { checkRateLimit } from "@/lib/rate-limit";

// POST /api/auth/forgot { email } — envoie un lien de réinitialisation.
// Réponse TOUJOURS générique (ne révèle pas si l'email existe).
export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({ email: "" }));
  const cleanEmail = String(email ?? "").toLowerCase().trim();

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const rl = checkRateLimit(`forgot:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ ok: true }); // silencieux
  }

  const generic: { ok: true; devLink?: string } = { ok: true };

  if (cleanEmail) {
    const user = await db.user.findUnique({ where: { email: cleanEmail } });
    if (user) {
      const token = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(token).digest("hex");
      await db.user.update({
        where: { id: user.id },
        data: {
          resetTokenHash: tokenHash,
          resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 h
        },
      });

      const link = `${req.nextUrl.origin}/reinitialiser?token=${token}`;
      await sendMail({
        to: cleanEmail,
        subject: "Réinitialisation de votre mot de passe MenuVid",
        text: `Réinitialisez votre mot de passe : ${link}\nCe lien expire dans 1 heure.`,
        html: `<p>Réinitialisez votre mot de passe :</p><p><a href="${link}">${link}</a></p><p>Ce lien expire dans 1 heure.</p>`,
      });

      // En local (démo, sans email configuré) : on renvoie le lien pour tester.
      if (process.env.NODE_ENV !== "production") generic.devLink = link;
    }
  }

  return NextResponse.json(generic);
}
