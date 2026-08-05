import { db } from "@/lib/db";
import { can } from "@/lib/plan";
import { parseList } from "@/lib/format";
import { giftConfigFrom, type GiftConfig } from "@/lib/gift";
import { parseOptions, type OptionGroup } from "@/lib/options";
import { parseSteps } from "@/lib/formules";

// Ce que l'interface convive reçoit (données "propres", prêtes à afficher).
export type DishDTO = {
  id: string;
  name: string;
  nameEn: string | null;
  description: string;
  descriptionEn: string | null;
  priceCents: number;
  photoUrl: string | null;
  videoUrl: string | null;
  badge: string | null;
  options: OptionGroup[];
  allergens: string[];
  diets: string[];
  available: boolean;
};

export type CategoryDTO = {
  id: string;
  name: string;
  nameEn: string | null;
  group: "boire" | "manger"; // pour l'écran d'accueil Boire / Manger
  dishes: DishDTO[];
};

// Classe une catégorie côté « boissons » d'après son nom (heuristique simple).
const DRINK_WORDS =
  /boisson|boire|bar\b|vin|cocktail|soft|jus|caf[ée]|th[ée]\b|bi[èe]re|champagne|spiritueux|dig[ée]stif|ap[ée]ritif|smoothie|limonade|eau\b|drink/i;
function categoryGroup(name: string): "boire" | "manger" {
  return DRINK_WORDS.test(name) ? "boire" : "manger";
}

// Une étape de formule : un choix parmi plusieurs plats.
export type FormuleStepDTO = {
  id: string;
  name: string;
  nameEn: string | null;
  choices: { id: string; name: string; nameEn: string | null; priceCents: number }[];
};

export type FormuleDTO = {
  id: string;
  name: string;
  nameEn: string | null;
  description: string;
  descriptionEn: string | null;
  priceCents: number;
  photoUrl: string | null;
  steps: FormuleStepDTO[];
};

export type MenuDTO = {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    brandColor: string;
    theme: string;
    welcomeMessage: string | null;
    welcomeMessageEn: string | null;
    offerEnglish: boolean;
    currency: string;
  };
  // Fonctionnalités déverrouillées selon le palier d'abonnement
  features: { video: boolean; ordering: boolean };
  tipEnabled: boolean;
  orderingPaused: boolean;
  introEnabled: boolean; // écran d'accueil « BIENVENUE → Boire / Manger »
  loyalty: { enabled: boolean; threshold: number; reward: string };
  gift: GiftConfig;
  formules: FormuleDTO[];
  categories: CategoryDTO[];
};

/**
 * Charge le menu complet d'un restaurant pour l'affichage convive.
 * Applique le verrou de palier : si le resto n'a pas l'option "vidéo",
 * les videoUrl sont retirées ; s'il n'a pas "commande", le panier sera masqué.
 */
export async function getMenu(slug: string): Promise<MenuDTO | null> {
  const resto = await db.restaurant.findUnique({
    where: { slug },
    include: {
      categories: {
        orderBy: { position: "asc" },
        include: { dishes: { orderBy: { position: "asc" } } },
      },
      formules: { where: { available: true }, orderBy: { position: "asc" } },
    },
  });
  if (!resto) return null;

  const hasVideo = can(resto.plan, "video");
  const hasOrdering = can(resto.plan, "ordering");

  // Index des plats disponibles (pour composer les étapes de formule).
  const dishById = new Map(
    resto.categories.flatMap((c) => c.dishes).map((d) => [d.id, d])
  );

  // Résout chaque formule : on ne garde que les plats encore disponibles.
  // Si une étape n'a plus aucun plat dispo, la formule est masquée (incomplète).
  const formules: FormuleDTO[] = [];
  for (const f of resto.formules) {
    const steps = parseSteps(f.stepsJson);
    const resolved: FormuleStepDTO[] = [];
    let complete = steps.length > 0;
    for (const s of steps) {
      const choices = s.dishIds
        .map((id) => dishById.get(id))
        .filter((d): d is NonNullable<typeof d> => !!d && d.available)
        .map((d) => ({
          id: d.id,
          name: d.name,
          nameEn: d.nameEn,
          priceCents: d.priceCents,
        }));
      if (choices.length === 0) {
        complete = false;
        break;
      }
      resolved.push({ id: s.id, name: s.name, nameEn: s.nameEn ?? null, choices });
    }
    if (!complete) continue;
    formules.push({
      id: f.id,
      name: f.name,
      nameEn: f.nameEn,
      description: f.description,
      descriptionEn: f.descriptionEn,
      priceCents: f.priceCents,
      photoUrl: f.photoUrl,
      steps: resolved,
    });
  }

  return {
    restaurant: {
      id: resto.id,
      name: resto.name,
      slug: resto.slug,
      logoUrl: resto.logoUrl,
      brandColor: resto.brandColor,
      theme: resto.theme,
      welcomeMessage: resto.welcomeMessage,
      welcomeMessageEn: resto.welcomeMessageEn,
      offerEnglish: resto.offerEnglish,
      currency: resto.currency,
    },
    features: { video: hasVideo, ordering: hasOrdering },
    tipEnabled: resto.tipEnabled,
    orderingPaused: resto.orderingPaused,
    introEnabled: resto.introEnabled,
    loyalty: {
      enabled: resto.loyaltyEnabled,
      threshold: resto.loyaltyThreshold,
      reward: resto.loyaltyReward,
    },
    gift: giftConfigFrom(resto),
    formules,
    categories: resto.categories.map((c) => ({
      id: c.id,
      name: c.name,
      nameEn: c.nameEn,
      group: categoryGroup(c.name),
      dishes: c.dishes.map((d) => ({
        id: d.id,
        name: d.name,
        nameEn: d.nameEn,
        description: d.description,
        descriptionEn: d.descriptionEn,
        priceCents: d.priceCents,
        photoUrl: d.photoUrl,
        videoUrl: hasVideo ? d.videoUrl : null, // verrou palier
        badge: d.badge,
        options: parseOptions(d.optionsJson),
        allergens: parseList(d.allergens),
        diets: parseList(d.diets),
        available: d.available,
      })),
    })),
  };
}

/** Résout une table par son numéro (pré-rempli via le QR code). */
export async function getTable(restaurantId: string, tableNumber: number) {
  return db.diningTable.findUnique({
    where: { restaurantId_number: { restaurantId, number: tableNumber } },
  });
}
