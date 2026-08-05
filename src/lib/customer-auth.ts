import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

// ============================================================================
//  Session des CLIENTS FIDÉLITÉ (convives) — cookie distinct de celui des
//  restaurateurs (mv_customer vs mv_session). Ne se mélangent jamais.
// ============================================================================

const COOKIE = "mv_customer";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-secret-a-changer-en-production-please"
);

export type CustomerSession = { cid: string; email: string };

export async function createCustomerSession(s: CustomerSession) {
  const token = await new SignJWT(s)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("180d")
    .sign(secret);
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
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as CustomerSession;
  } catch {
    return null;
  }
}

export async function destroyCustomerSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
