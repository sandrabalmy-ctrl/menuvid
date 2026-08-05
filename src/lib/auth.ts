import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

// ============================================================================
//  Authentification restaurateur — session signée dans un cookie httpOnly.
//  Minimaliste mais réelle (mot de passe haché bcrypt + jeton signé).
//  Pourra être remplacée par Auth.js si besoin, sans changer le reste.
// ============================================================================

const COOKIE = "mv_session";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-secret-a-changer-en-production-please"
);

export type Session = { uid: string; rid: string | null; role: string };

export async function createSession(s: Session) {
  const token = await new SignJWT(s)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
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
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
