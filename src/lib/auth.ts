import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/lib/db";

// ============================================================================
//  Authentification restaurateur — session signée dans un cookie httpOnly.
//  Minimaliste mais réelle (mot de passe haché bcrypt + jeton signé).
//  Pourra être remplacée par Auth.js si besoin, sans changer le reste.
// ============================================================================

const COOKIE = "mv_session";

// Le secret de signature DOIT venir de l'environnement. Pas de valeur par
// défaut : sans secret configuré, on refuse plutôt que de signer avec une clé
// publique (qui permettrait de forger un cookie « SUPERADMIN »). Lu à la volée
// pour ne pas faire échouer le build.
function getSecret(): Uint8Array {
  const raw = process.env.AUTH_SECRET;
  if (!raw) {
    throw new Error("AUTH_SECRET manquant. Définissez une clé secrète forte.");
  }
  return new TextEncoder().encode(raw);
}

// `ep` = version de session (epoch) figée dans le jeton ; comparée à celle en
// base pour permettre la révocation (déconnexion partout / reset mot de passe).
export type Session = { uid: string; rid: string | null; role: string; ep?: number };

export async function createSession(s: Session) {
  const token = await new SignJWT(s)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    const session = payload as unknown as Session;
    // Révocation : le jeton n'est valable que si son epoch correspond à la base.
    const user = await db.user.findUnique({
      where: { id: session.uid },
      select: { sessionEpoch: true },
    });
    if (!user || (session.ep ?? 0) !== user.sessionEpoch) return null;
    return session;
  } catch {
    return null;
  }
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
