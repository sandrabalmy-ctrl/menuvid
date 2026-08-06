/* Migration ponctuelle (idempotente) : regroupe Pizzas + Burgers + Pâtes +
   Grillades & Poissons dans une seule catégorie « Plats » pour Amazonia.
   S'exécute à chaque déploiement mais ne fait rien une fois la fusion faite. */
const { PrismaClient } = require("../src/generated/prisma");
const db = new PrismaClient();

(async () => {
  const r = await db.restaurant.findUnique({
    where: { slug: "amazonia" },
    include: { categories: { include: { dishes: true } } },
  });
  if (!r) return console.log("migrate-plats : restaurant absent, ignoré.");

  const byName = {};
  r.categories.forEach((c) => (byName[c.name] = c));

  // « Pizzas » devient « Plats » (ou déjà « Plats » si migration déjà faite).
  const plats = byName["Plats"] || byName["Pizzas"];
  if (!plats) return console.log("migrate-plats : rien à fusionner.");

  const groups = [
    ["Burgers", 100],
    ["Pâtes", 200],
    ["Grillades & Poissons", 300],
  ];

  const toDelete = [];
  for (const [name, off] of groups) {
    const cat = byName[name];
    if (!cat) continue; // déjà fusionné
    for (const d of cat.dishes) {
      await db.dish.update({
        where: { id: d.id },
        data: { categoryId: plats.id, position: d.position + off },
      });
    }
    toDelete.push(cat.id);
  }

  await db.category.update({
    where: { id: plats.id },
    data: { name: "Plats", position: 1 },
  });
  if (byName["Entrées"])
    await db.category.update({
      where: { id: byName["Entrées"].id },
      data: { position: 0 },
    });
  if (byName["Desserts"])
    await db.category.update({
      where: { id: byName["Desserts"].id },
      data: { position: 2 },
    });
  for (const id of toDelete) await db.category.delete({ where: { id } });

  console.log(
    toDelete.length
      ? `migrate-plats : fusion effectuée (${toDelete.length} catégories regroupées).`
      : "migrate-plats : déjà fusionné, rien à faire."
  );
})()
  .catch((e) => console.error("migrate-plats erreur (ignorée) :", e.message))
  .finally(() => process.exit(0));
