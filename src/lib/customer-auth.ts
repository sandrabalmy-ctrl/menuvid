import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

// ============================================================================
//  Session des CLIENTS FIDÉLITÉ (convives) — cookie distinct de celui des
//  restaurateurs (mv_customer vs mv_session). Ne se mélangent jamais.
// ============================================================================

const COOKIE = "mv_customer";

// Même exigence que la session restaurateur : aucun secret par défaut.
function getSecret(): Uint8Array {
  const raw = process.env.AUTH_SECRET;
  if (!raw) {
    throw new Error("AUTH_SECRET manquant. Définissez une clé secrète forte.");
  }
  return new TextEncoder().encode(raw);
}

export type CustomerSession = { cid: string; email: string };

export async function createCustomerSession(s: CustomerSession) {
  const token = await new SignJWT(s)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("180d")
    .sign(getSecret());
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    return payload as unknown as CustomerSession;
  } catch {
    return null;
  }
}

export async function destroyCustomerSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
