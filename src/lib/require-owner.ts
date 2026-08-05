import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Page d'accueil par défaut selon le rôle (évite les redirections en boucle).
function homeFor(role: string) {
  if (role === "KITCHEN") return "/cuisine";
  if (role === "STAFF") return "/dashboard/commandes";
  return "/dashboard";
}

// Charge le restaurant de la session, en vérifiant le rôle autorisé.
async function loadFor(roles: string[]) {
  const session = await getSession();
  if (!session?.rid) redirect("/connexion");
  // Rôle non autorisé → on renvoie chacun vers SON espace (jamais vers une
  // page qu'il n'a pas le droit de voir, sinon boucle de redirection).
  if (!roles.includes(session.role)) redirect(homeFor(session.role));

  const restaurant = await db.restaurant.findUnique({
    where: { id: session.rid },
  });
  if (!restaurant) redirect("/connexion");
  return { session, restaurant };
}

// Réservé au PROPRIÉTAIRE (réglages, apparence, abonnement, équipe…).
export function requireOwner() {
  return loadFor(["OWNER"]);
}

// Propriétaire OU personnel de salle (commandes, menu, tables, stats).
export function requireStaff() {
  return loadFor(["OWNER", "STAFF"]);
}

// Accès à l'écran cuisine : propriétaire, salle ou cuisine.
export function requireKitchen() {
  return loadFor(["OWNER", "STAFF", "KITCHEN"]);
}
