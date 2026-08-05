import { db } from "@/lib/db";
import { stringifyList } from "@/lib/format";
import { parseOptions } from "@/lib/options";

// Normalise et valide les données d'un plat envoyées par le formulaire.
// Résout aussi la catégorie (existante, ou nouvelle à créer) en restant
// strictement dans le périmètre du restaurant (multi-tenant).
export async function buildDishData(
  restaurantId: string,
  body: Record<string, unknown>
) {
  const name = String(body.name ?? "").trim();
  if (!name) throw new Error("Le nom du plat est requis.");

  const priceCents = Math.max(0, Math.round(Number(body.priceEuros) * 100) || 0);

  // Catégorie : soit un id existant (vérifié), soit un nouveau nom à créer.
  let categoryId = body.categoryId ? String(body.categoryId) : "";
  const newCategoryName = String(body.newCategoryName ?? "").trim();
  if (newCategoryName) {
    const last = await db.category.findFirst({
      where: { restaurantId },
      orderBy: { position: "desc" },
    });
    const cat = await db.category.create({
      data: {
        restaurantId,
        name: newCategoryName,
        position: (last?.position ?? -1) + 1,
      },
    });
    categoryId = cat.id;
  } else {
    const cat = await db.category.findFirst({
      where: { id: categoryId, restaurantId },
    });
    if (!cat) throw new Error("Catégorie invalide.");
  }

  const allergens = Array.isArray(body.allergens)
    ? (body.allergens as string[])
    : [];
  const diets = Array.isArray(body.diets) ? (body.diets as string[]) : [];

  const badge =
    body.badge === "populaire" ||
    body.badge === "coup-de-coeur" ||
    body.badge === "plat-du-jour"
      ? String(body.badge)
      : null;

  const nameEn = body.nameEn ? String(body.nameEn).trim() || null : null;
  const descriptionEn = body.descriptionEn
    ? String(body.descriptionEn).trim() || null
    : null;

  // Options : on revalide via parseOptions puis on re-sérialise (sécurité).
  const optionsJson = JSON.stringify(
    parseOptions(JSON.stringify(Array.isArray(body.options) ? body.options : []))
  );

  return {
    categoryId,
    name,
    nameEn,
    description: String(body.description ?? "").trim(),
    descriptionEn,
    priceCents,
    optionsJson,
    photoUrl: body.photoUrl ? String(body.photoUrl) : null,
    videoUrl: body.videoUrl ? String(body.videoUrl) : null,
    badge,
    allergens: stringifyList(allergens),
    diets: stringifyList(diets),
    available: body.available !== false,
  };
}
