import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { PLANS, type Plan } from "@/lib/plan";

// Transforme un nom de restaurant en "slug" d'URL (chez-marco).
export function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // enlève les accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

async function uniqueSlug(base: string) {
  let slug = base || "restaurant";
  let i = 2;
  while (await db.restaurant.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

/**
 * Provisionne un restaurant complet, prêt à l'emploi (self-service onboarding) :
 * restaurant + compte propriétaire + catégories par défaut + quelques tables +
 * abonnement. Aucun développement nécessaire pour ajouter un client.
 */
export async function provisionRestaurant(input: {
  name: string;
  ownerEmail: string;
  ownerPassword: string;
  plan?: Plan;
  tableCount?: number;
}) {
  const plan: Plan = input.plan ?? "VIDEO";
  const slug = await uniqueSlug(slugify(input.name));

  const restaurant = await db.restaurant.create({
    data: {
      name: input.name,
      slug,
      plan,
      status: "ACTIVE",
      subscription: {
        create: { plan, priceCents: PLANS[plan].priceCents, status: "ACTIVE" },
      },
      users: {
        create: {
          email: input.ownerEmail.toLowerCase().trim(),
          passwordHash: await bcrypt.hash(input.ownerPassword, 12),
          role: "OWNER",
        },
      },
      categories: {
        create: [
          { name: "Entrées", position: 0 },
          { name: "Plats", position: 1 },
          { name: "Desserts", position: 2 },
          { name: "Boissons", position: 3 },
        ],
      },
      tables: {
        create: Array.from({ length: input.tableCount ?? 8 }, (_, i) => ({
          number: i + 1,
        })),
      },
    },
  });

  return restaurant;
}
