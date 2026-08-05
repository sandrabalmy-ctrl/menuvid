/* Onboarding Amazonia Dakar : restaurant + carte complète (FCFA) + compte proprio. */
const { PrismaClient } = require("../src/generated/prisma");
const bcrypt = require("bcryptjs");
const p = new PrismaClient();

// Prix affichés en FCFA. On stocke en "centimes" (convention de l'app) => x100.
const f = (fcfa) => fcfa * 100;

const MENU = [
  {
    name: "Entrées",
    dishes: [
      ["Carpaccio de bœuf", 10000, "Fines tranches de bœuf, roquette, copeaux de parmesan, huile d'olive vierge extra et fleur de sel."],
      ["Tomates & burrata", 10000, "Tomates fraîches, burrata crémeuse, basilic frais, huile d'olive vierge extra et crème de balsamique.", ["vegetarien"]],
      ["Salade César", 9500, "Laitue romaine, poulet grillé, œuf, tomates cerises, croûtons à l'ail, copeaux de parmesan et sauce César."],
      ["Salade au saumon", 10000, "Laitue romaine, saumon fumé, tomates cerises, julienne de carottes et de poivrons, oignons et vinaigrette à la moutarde."],
      ["Salade Crunchy Amazonia", 9000, "Laitue romaine, poulet grillé, oignons caramélisés, tomates cerises, cœurs de palmier, œuf dur et sauce César."],
      ["Salade de chèvre chaud", 11000, "Laitue romaine, chèvre chaud, pommes, champignons sautés, noix et vinaigrette au miel balsamique.", ["vegetarien"]],
      ["Crispy Gambas", 9500, "Gambas croustillantes servies avec une sauce chili thaï."],
      ["Gratin de fruits de mer", 9000, "Mélange de fruits de mer gratinés dans une sauce crémeuse au fromage."],
    ],
  },
  {
    name: "Pizzas",
    dishes: [
      ["Pizza Viande hachée", 10000, "Sauce tomate, mozzarella, viande hachée et oignons."],
      ["Pizza Margherita", 9000, "Sauce tomate, mozzarella, basilic frais et olives.", ["vegetarien"]],
      ["Pizza Reine", 11000, "Sauce tomate, mozzarella, jambon, champignons et olives."],
      ["Pizza au poulet", 11000, "Sauce tomate, mozzarella, poulet, champignons et olives."],
      ["Pizza aux fruits de mer", 12000, "Sauce tomate, mozzarella et assortiment de fruits de mer."],
      ["Pizza Amazonia", 12000, "Sauce tomate, mozzarella, jambon, oignons caramélisés, basilic et olives."],
      ["Pizza Mixte", 11000, "Sauce tomate, mozzarella, lamelles de bœuf, poulet et champignons."],
      ["Pizza Végétarienne", 9000, "Sauce tomate, mozzarella et légumes grillés.", ["vegetarien"]],
    ],
  },
  {
    name: "Burgers",
    dishes: [
      ["Gourmet Burger", 10000, "Pain brioché maison, steak haché pur bœuf grillé, cheddar, laitue, tomates, oignons caramélisés, cornichons, pommes caramélisées, œuf à cheval, sauce maison, accompagné de frites."],
      ["Tartiflette Burger", 10000, "Pain brioché maison, steak haché pur bœuf grillé, cheddar, œuf à cheval, jambon fumé de bœuf, stick de fromage pané, oignons grillés, laitue, tomates, accompagné de frites."],
      ["Burger Forestier", 9500, "Pain brioché maison, steak haché pur bœuf grillé, cheddar, œuf à cheval, champignons grillés, onion rings, laitue, tomates, accompagné de frites."],
    ],
  },
  {
    name: "Pâtes",
    dishes: [
      ["Lasagnes", 10000, "Pâtes fraîches, viande de bœuf hachée, sauce tomate, emmental et sauce béchamel onctueuse."],
      ["Linguine aux fruits de mer", 14000, "Linguine, crevettes, calamars, moules, palourdes et sauce crémeuse aux fruits de mer."],
      ["Linguine aux gambas, sauce pesto", 12000, "Linguine, gambas sautées et sauce pesto au basilic."],
      ["Pâtes forestières", 10000, "Pâtes, filet de poulet, champignons frais et sauce crémeuse."],
      ["Pâtes aux lamelles de bœuf", 10000, "Pâtes, lamelles de bœuf sautées et sauce crémeuse."],
      ["Linguine aux crevettes, crème fraîche", 11000, "Linguine, crevettes sautées et sauce à la crème fraîche."],
      ["Linguine aux crevettes, sauce tomate", 10000, "Linguine, crevettes sautées et sauce tomate maison."],
    ],
  },
  {
    name: "Grillades & Poissons",
    dishes: [
      ["Filet de bœuf", 15000, "Filet de bœuf grillé, servi avec une purée de pommes de terre."],
      ["Entrecôte grillée (importée)", 22000, "Entrecôte de bœuf importée, grillée et servie avec des frites."],
      ["Épaule d'agneau", 25000, "Épaule d'agneau marinée et grillée, servie avec des frites."],
      ["Côtelettes d'agneau", 26000, "Côtelettes d'agneau marinées et grillées, servies avec une purée de pommes de terre et des légumes."],
      ["Brochettes de bœuf", 15000, "Brochettes de bœuf marinées et grillées, servies avec des pommes grenailles."],
      ["Brochettes de poulet", 14000, "Brochettes de poulet marinées et grillées, servies avec des pommes grenailles."],
      ["Brochettes de gambas", 15000, "Brochettes de gambas marinées et grillées, servies avec une purée de potiron."],
      ["Brochettes de lotte", 10000, "Brochettes de lotte marinées et grillées, servies avec du riz."],
      ["Thiof grillé", 17000, "Filet de thiof grillé, servi avec du riz."],
      ["Camerons grillés", 30000, "Camerons grillés, servis avec du riz."],
      ["Crevettes sautées à l'ail", 14000, "Crevettes sautées à l'ail frais, persil et beurre."],
    ],
  },
  {
    name: "Desserts",
    dishes: [
      ["Pain perdu", 6000, "Pain brioché caramélisé, servi chaud, accompagné d'une boule de glace vanille.", ["vegetarien"]],
      ["Fondant au chocolat", 6000, "Fondant au chocolat servi tiède, accompagné d'une boule de glace vanille.", ["vegetarien"]],
      ["Crêpe au Nutella", 5000, "Crêpe maison garnie de Nutella.", ["vegetarien"]],
      ["Assiette de fruits", 6000, "Assortiment de fruits frais de saison.", ["vegetarien", "vegan"]],
      ["Cheesecake", 6500, "Cheesecake crémeux sur biscuit croquant.", ["vegetarien"]],
    ],
  },
];

(async () => {
  const slug = "amazonia";
  const restoData = {
    name: "Amazonia Dakar",
    slug,
    currency: "XOF",
    theme: "amazonia",
    brandColor: "#d69b84",
    welcomeMessage: "Bienvenue chez Amazonia 🌿 Saveurs & passion. Découvrez nos plats en vidéo et commandez depuis votre table.",
    defaultLocale: "fr",
    plan: "ORDER",
    status: "ACTIVE",
    tipEnabled: true,
    loyaltyEnabled: true,
    loyaltyThreshold: 10,
    loyaltyReward: "Un dessert offert",
  };

  const resto = await p.restaurant.upsert({
    where: { slug },
    update: restoData,
    create: restoData,
  });

  // On repart d'une carte propre (supprime catégories -> plats en cascade).
  await p.category.deleteMany({ where: { restaurantId: resto.id } });

  for (let ci = 0; ci < MENU.length; ci++) {
    const cat = MENU[ci];
    const category = await p.category.create({
      data: { restaurantId: resto.id, name: cat.name, position: ci },
    });
    for (let di = 0; di < cat.dishes.length; di++) {
      const [name, fcfa, description, diets] = cat.dishes[di];
      await p.dish.create({
        data: {
          restaurantId: resto.id,
          categoryId: category.id,
          name,
          priceCents: f(fcfa),
          description,
          diets: JSON.stringify(diets ?? []),
          position: di,
        },
      });
    }
  }

  // Tables 1 à 15 (avec QR).
  for (let n = 1; n <= 15; n++) {
    await p.diningTable.upsert({
      where: { restaurantId_number: { restaurantId: resto.id, number: n } },
      update: {},
      create: { restaurantId: resto.id, number: n },
    });
  }

  // Compte propriétaire.
  const hash = await bcrypt.hash("amazonia2024", 10);
  await p.user.upsert({
    where: { email: "amazonia@demo.fr" },
    update: { role: "OWNER", restaurantId: resto.id, passwordHash: hash },
    create: { email: "amazonia@demo.fr", role: "OWNER", restaurantId: resto.id, passwordHash: hash },
  });

  const dishCount = await p.dish.count({ where: { restaurantId: resto.id } });
  console.log(`✓ Amazonia Dakar créé — ${MENU.length} catégories, ${dishCount} plats, devise XOF (FCFA).`);
  console.log(`  Menu client : /r/${slug}/t/1`);
  console.log(`  Back-office : amazonia@demo.fr / amazonia2024`);
  process.exit(0);
})();
