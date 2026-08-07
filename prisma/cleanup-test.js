/* Nettoyage ponctuel (idempotent) : supprime les ventes de test créées pendant
   la vérification de sécurité (repérées par leur motif de remboursement).
   Ne touche à aucune vraie vente. Ne fait rien une fois le ménage effectué. */
const { PrismaClient } = require("../src/generated/prisma");
const db = new PrismaClient();

(async () => {
  const testOrders = await db.order.findMany({
    where: { refundReason: "test sécurité" },
    select: { id: true },
  });
  if (testOrders.length === 0) {
    return console.log("cleanup-test : aucune vente de test, rien à faire.");
  }
  const ids = testOrders.map((o) => o.id);
  // Les lignes (OrderItem) sont supprimées en cascade avec la commande.
  await db.order.deleteMany({ where: { id: { in: ids } } });
  console.log(`cleanup-test : ${ids.length} vente(s) de test supprimée(s).`);
})()
  .catch((e) => console.error("cleanup-test erreur (ignorée) :", e.message))
  .finally(() => process.exit(0));
