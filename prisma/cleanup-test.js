/* Nettoyage ponctuel (idempotent) : supprime les données de test créées pendant
   les vérifications de sécurité (ventes repérées par leur motif de remboursement,
   comptes au préfixe dédié). Ne touche à aucune vraie donnée. */
const { PrismaClient } = require("../src/generated/prisma");
const db = new PrismaClient();

(async () => {
  // Ventes de test (OrderItem supprimés en cascade).
  const orders = await db.order.deleteMany({
    where: { refundReason: "test sécurité" },
  });
  if (orders.count) {
    console.log(`cleanup-test : ${orders.count} vente(s) de test supprimée(s).`);
  }

  // Comptes de test (préfixe dédié).
  const users = await db.user.deleteMany({
    where: { email: { startsWith: "tmp_strong_" } },
  });
  if (users.count) {
    console.log(`cleanup-test : ${users.count} compte(s) de test supprimé(s).`);
  }

  if (!orders.count && !users.count) {
    console.log("cleanup-test : rien à nettoyer.");
  }
})()
  .catch((e) => console.error("cleanup-test erreur (ignorée) :", e.message))
  .finally(() => process.exit(0));
