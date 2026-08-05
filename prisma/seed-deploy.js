/* Peuplement du serveur en ligne : rejoue l'état exporté (seed-data.json).
   Idempotent : ne fait rien si la base contient déjà des restaurants. */
const { PrismaClient } = require("../src/generated/prisma");
const data = require("./seed-data.json");
const db = new PrismaClient();

(async () => {
  const existing = await db.restaurant.count();
  if (existing > 0) {
    console.log(`Base déjà peuplée (${existing} restaurants) — seed ignoré.`);
    process.exit(0);
  }
  console.log("Base vide — insertion du contenu…");

  // Ordre respectant les clés étrangères.
  await db.restaurant.createMany({ data: data.restaurants });
  await db.user.createMany({ data: data.users });
  await db.category.createMany({ data: data.categories });
  await db.dish.createMany({ data: data.dishes });
  await db.diningTable.createMany({ data: data.tables });
  if (Array.isArray(data.formules) && data.formules.length) {
    await db.formule.createMany({ data: data.formules });
  }

  console.log(
    `✓ Contenu inséré : ${data.restaurants.length} restaurants, ` +
      `${data.dishes.length} plats, ${data.users.length} comptes.`
  );
  process.exit(0);
})().catch((e) => {
  console.error("Échec du seed:", e);
  process.exit(1);
});
