import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

// Garde d'accès à l'espace super-admin (vous). Réservé au rôle SUPERADMIN.
export async function requireSuperAdmin() {
  const session = await getSession();
  if (!session || session.role !== "SUPERADMIN") redirect("/connexion");
  return session;
}
