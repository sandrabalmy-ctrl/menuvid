import { NextResponse } from "next/server";
import { destroyCustomerSession } from "@/lib/customer-auth";

// POST /api/customer/logout — déconnexion du client fidélité.
export async function POST() {
  await destroyCustomerSession();
  return NextResponse.json({ ok: true });
}
