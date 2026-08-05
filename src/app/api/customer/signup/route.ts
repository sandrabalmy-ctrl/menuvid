import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createCustomerSession } from "@/lib/customer-auth";

// POST /api/customer/signup — création d'un compte client (fidélité).
export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json().catch(() => ({}));
  const cleanEmail = String(email ?? "").toLowerCase().trim();

  if (!cleanEmail || typeof password !== "string" || password.length < 6) {
    return NextResponse.json(
      { error: "Email et mot de passe (6 caractères min.) requis." },
      { status: 400 }
    );
  }
  const exists = await db.customer.findUnique({ where: { email: cleanEmail } });
  if (exists) {
    return NextResponse.json(
      { error: "Un compte existe déjà avec cet email." },
      { status: 400 }
    );
  }

  const customer = await db.customer.create({
    data: {
      email: cleanEmail,
      passwordHash: await bcrypt.hash(password, 10),
      name: name ? String(name).slice(0, 60) : null,
    },
  });

  await createCustomerSession({ cid: customer.id, email: customer.email });
  return NextResponse.json({ ok: true, name: customer.name });
}
