// ============================================================================
//  Données de démonstration — restaurant fictif "Chez Marco".
//  Lancer avec : npm run db:seed
//  ⚠️ Les vidéos sont des CLIPS D'EXEMPLE (placeholders) le temps de valider
//     l'expérience. On les remplacera par de vraies vidéos de plats (upload
//     ou génération auto depuis une photo).
// ============================================================================
import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// Photos réelles (Unsplash) — fiables et libres pour la démo.
const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=70`;

// Clips d'exemple (PLACEHOLDERS génériques) — le temps de valider le mécanisme
// vidéo. Le poster affiché = la vraie photo du plat. À remplacer par de vraies
// vidéos de plats (upload restaurateur, ou génération auto depuis la photo).
const clips = [
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  "https://media.w3.org/2010/05/sintel/trailer.mp4",
  "https://assets.mixkit.co/videos/4067/4067-720.mp4",
  "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4",
  "https://www.w3schools.com/html/mov_bbb.mp4",
];
const clip = (i: number) => clips[i % clips.length];

async function main() {
  // Repartir propre à chaque seed
  await db.loyaltyMembership.deleteMany();
  await db.customer.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.analyticsEvent.deleteMany();
  await db.dish.deleteMany();
  await db.category.deleteMany();
  await db.diningTable.deleteMany();
  await db.subscription.deleteMany();
  await db.user.deleteMany();
  await db.restaurant.deleteMany();

  const resto = await db.restaurant.create({
    data: {
      name: "Chez Marco",
      slug: "chez-marco",
      brandColor: "#E11D48",
      theme: "blanc-casse",
      welcomeMessage:
        "Bonjour et bienvenue chez Marco ! 👋\nInstallez-vous, découvrez nos plats en vidéo et commandez directement depuis votre table.",
      welcomeMessageEn:
        "Hi and welcome to Chez Marco! 👋\nSit back, discover our dishes in video and order right from your table.",
      offerEnglish: true,
      tipEnabled: true,
      onlinePaymentEnabled: true,
      loyaltyEnabled: true,
      loyaltyThreshold: 10,
      loyaltyReward: "Un plat offert 🍽️",
      reviewGiftEnabled: true,
      googleReviewUrl: "https://www.google.com/maps/search/restaurant",
      reviewPrizes: JSON.stringify([
        { label: "Café offert", weight: 3 },
        { label: "-10% sur l'addition", weight: 2 },
        { label: "Dessert offert", weight: 1 },
        { label: "Un verre offert", weight: 2 },
        { label: "Encore raté !", weight: 4 },
      ]),
      defaultLocale: "fr",
      plan: "ORDER", // accès complet pour la démo (menu + vidéo + commande)
      status: "ACTIVE",
    },
  });

  // Abonnement du restaurant de démo (palier Commande = 57€/mois)
  await db.subscription.create({
    data: {
      restaurantId: resto.id,
      plan: "ORDER",
      priceCents: 5700,
      status: "ACTIVE",
    },
  });

  // Compte SUPER-ADMIN (vous) — rattaché à aucun restaurant
  await db.user.create({
    data: {
      restaurantId: null,
      email: "admin@menuvid.fr",
      passwordHash: await bcrypt.hash("admin1234", 10),
      role: "SUPERADMIN",
    },
  });

  // Compte restaurateur de démo (pour se connecter au back-office)
  await db.user.create({
    data: {
      restaurantId: resto.id,
      email: "marco@demo.fr",
      passwordHash: await bcrypt.hash("demo1234", 10),
      role: "OWNER",
    },
  });

  // Client fidélité de démo (déjà à 7/10 pour voir la progression)
  const demoCustomer = await db.customer.create({
    data: {
      email: "client@test.fr",
      passwordHash: await bcrypt.hash("secret1", 10),
      name: "Julie",
    },
  });
  await db.loyaltyMembership.create({
    data: { customerId: demoCustomer.id, restaurantId: resto.id, points: 7 },
  });

  // Tables + QR (10 tables)
  for (let n = 1; n <= 10; n++) {
    await db.diningTable.create({
      data: { restaurantId: resto.id, number: n },
    });
  }

  // --- Catégories + plats ---------------------------------------------------
  type DishSeed = {
    name: string;
    description: string;
    priceCents: number;
    photo: string;
    video?: string; // vidéo dédiée (ex. vraie vidéo IA), sinon clip d'exemple
    badge?: string; // "populaire" | "coup-de-coeur"
    allergens?: string[];
    diets?: string[];
    available?: boolean;
  };

  const menu: { category: string; dishes: DishSeed[] }[] = [
    {
      category: "Entrées",
      dishes: [
        {
          name: "Burrata crémeuse & tomates anciennes",
          description: "Burrata des Pouilles, tomates de saison, huile d'olive, basilic frais.",
          priceCents: 1200,
          photo: img("1572695157366-5e585ab2b69f"),
          allergens: ["lactose"],
          diets: ["vegetarien"],
        },
        {
          name: "Velouté de potimarron",
          description: "Crème de potimarron rôti, éclats de noisette, huile de courge.",
          priceCents: 950,
          photo: img("1547592180-85f173990554"),
          badge: "plat-du-jour",
          diets: ["vegetarien", "sans-gluten"],
        },
        {
          name: "Bruschetta truffe",
          description: "Pain grillé, ricotta, champignons et huile de truffe.",
          priceCents: 1100,
          photo: img("1592415486689-125cbbfcbee2"),
          allergens: ["gluten", "lactose"],
          diets: ["vegetarien"],
        },
      ],
    },
    {
      category: "Plats",
      dishes: [
        {
          name: "Burger signature Marco",
          description: "Bœuf race à viande 180g, cheddar affiné, oignons confits, frites maison.",
          priceCents: 1690,
          photo: img("1568901346375-23c9450c58cd"),
          video: "/videos/burger.mp4", // 🎬 vraie vidéo générée par IA depuis la photo
          badge: "populaire",
          allergens: ["gluten", "lactose", "oeuf"],
        },
        {
          name: "Pizza Regina",
          description: "Sauce tomate San Marzano, mozzarella fior di latte, jambon, champignons.",
          priceCents: 1450,
          photo: img("1513104890138-7c749659a591"),
          video: "/videos/pizza.mp4", // 🎬 vraie vidéo générée par IA depuis la photo
          allergens: ["gluten", "lactose"],
        },
        {
          name: "Tagliatelles aux cèpes",
          description: "Pâtes fraîches, crème de cèpes, parmesan 24 mois.",
          priceCents: 1550,
          photo: img("1473093295043-cdd812d0e601"),
          allergens: ["gluten", "lactose", "oeuf"],
          diets: ["vegetarien"],
        },
        {
          name: "Pavé de saumon rôti",
          description: "Saumon Label Rouge, écrasé de pommes de terre, beurre citronné.",
          priceCents: 1890,
          photo: img("1467003909585-2f8a72700288"),
          allergens: ["poisson", "lactose"],
          diets: ["sans-gluten"],
        },
        {
          name: "Salade César poulet",
          description: "Poulet grillé, romaine, copeaux de parmesan, croûtons, sauce César.",
          priceCents: 1390,
          photo: img("1512621776951-a57141f2eefd"),
          allergens: ["gluten", "lactose", "oeuf"],
          available: false, // démo : plat en rupture (désactivé)
        },
      ],
    },
    {
      category: "Desserts",
      dishes: [
        {
          name: "Tiramisu maison",
          description: "Mascarpone, café espresso, biscuit cuillère, cacao.",
          priceCents: 750,
          photo: img("1571877227200-a0d98ea607e9"),
          video: "/videos/tiramisu.mp4", // 🎬 vraie vidéo générée par IA depuis la photo
          badge: "coup-de-coeur",
          allergens: ["gluten", "lactose", "oeuf"],
          diets: ["vegetarien"],
        },
        {
          name: "Fondant au chocolat",
          description: "Cœur coulant chocolat noir 70%, glace vanille bourbon.",
          priceCents: 850,
          photo: img("1578985545062-69928b1d9587"),
          allergens: ["gluten", "lactose", "oeuf"],
          diets: ["vegetarien"],
        },
        {
          name: "Crème brûlée vanille",
          description: "Vanille de Madagascar, caramel croustillant.",
          priceCents: 700,
          photo: img("1470324161839-ce2bb6fa6bc3"),
          allergens: ["lactose", "oeuf"],
          diets: ["vegetarien", "sans-gluten"],
        },
      ],
    },
    {
      category: "Boissons",
      dishes: [
        {
          name: "Limonade artisanale",
          description: "Citron pressé, menthe fraîche, eau pétillante.",
          priceCents: 550,
          photo: img("1621263764928-df1444c5e859"),
          diets: ["vegan", "sans-gluten"],
        },
        {
          name: "Verre de Côtes-du-Rhône",
          description: "Rouge, notes de fruits rouges et d'épices. 12,5%.",
          priceCents: 650,
          photo: img("1553361371-9b22f78e8b1d"),
          diets: ["vegan", "sans-gluten"],
        },
        {
          name: "Espresso",
          description: "Torréfaction italienne, tasse serrée.",
          priceCents: 250,
          photo: img("1509042239860-f550ce710b93"),
          diets: ["vegan", "sans-gluten"],
        },
      ],
    },
  ];

  // Traductions anglaises (démo bilingue).
  const CATEGORY_EN: Record<string, string> = {
    "Entrées": "Starters",
    "Plats": "Mains",
    "Desserts": "Desserts",
    "Boissons": "Drinks",
  };
  const DISH_EN: Record<string, { name: string; description: string }> = {
    "Burrata crémeuse & tomates anciennes": {
      name: "Creamy burrata & heirloom tomatoes",
      description: "Burrata from Puglia, seasonal tomatoes, olive oil, fresh basil.",
    },
    "Velouté de potimarron": {
      name: "Roasted squash soup",
      description: "Roasted squash cream, hazelnut bits, pumpkin-seed oil.",
    },
    "Bruschetta truffe": {
      name: "Truffle bruschetta",
      description: "Toasted bread, ricotta, mushrooms and truffle oil.",
    },
    "Burger signature Marco": {
      name: "Marco's signature burger",
      description: "180g beef patty, aged cheddar, caramelised onions, homemade fries.",
    },
    "Pizza Regina": {
      name: "Regina pizza",
      description: "San Marzano tomato sauce, fior di latte mozzarella, ham, mushrooms.",
    },
    "Tagliatelles aux cèpes": {
      name: "Porcini tagliatelle",
      description: "Fresh pasta, porcini cream, 24-month parmesan.",
    },
    "Pavé de saumon rôti": {
      name: "Roasted salmon fillet",
      description: "Label Rouge salmon, mashed potatoes, lemon butter.",
    },
    "Salade César poulet": {
      name: "Chicken Caesar salad",
      description: "Grilled chicken, romaine, parmesan shavings, croutons, Caesar dressing.",
    },
    "Tiramisu maison": {
      name: "Homemade tiramisu",
      description: "Mascarpone, espresso, ladyfingers, cocoa.",
    },
    "Fondant au chocolat": {
      name: "Chocolate lava cake",
      description: "Molten 70% dark chocolate, bourbon vanilla ice cream.",
    },
    "Crème brûlée vanille": {
      name: "Vanilla crème brûlée",
      description: "Madagascar vanilla, crunchy caramel.",
    },
    "Limonade artisanale": {
      name: "Craft lemonade",
      description: "Fresh lemon, mint, sparkling water.",
    },
    "Verre de Côtes-du-Rhône": {
      name: "Glass of Côtes-du-Rhône",
      description: "Red wine, red-fruit and spice notes. 12.5%.",
    },
    "Espresso": {
      name: "Espresso",
      description: "Italian roast, short and strong.",
    },
  };

  // Options de démo (cuisson + suppléments payants sur le burger).
  const DISH_OPTIONS: Record<string, unknown[]> = {
    "Burger signature Marco": [
      {
        id: "g-cuisson",
        name: "Cuisson",
        type: "single",
        required: true,
        choices: [
          { id: "c-saignant", label: "Saignant", priceCents: 0 },
          { id: "c-apoint", label: "À point", priceCents: 0 },
          { id: "c-biencuit", label: "Bien cuit", priceCents: 0 },
        ],
      },
      {
        id: "g-supp",
        name: "Suppléments",
        type: "multiple",
        required: false,
        choices: [
          { id: "s-bacon", label: "Bacon", priceCents: 200 },
          { id: "s-oeuf", label: "Œuf", priceCents: 150 },
          { id: "s-cheddar", label: "Double cheddar", priceCents: 200 },
        ],
      },
    ],
  };

  let clipIdx = 0;
  for (let c = 0; c < menu.length; c++) {
    const cat = await db.category.create({
      data: {
        restaurantId: resto.id,
        name: menu[c].category,
        nameEn: CATEGORY_EN[menu[c].category] ?? null,
        position: c,
      },
    });
    for (let d = 0; d < menu[c].dishes.length; d++) {
      const dish = menu[c].dishes[d];
      const en = DISH_EN[dish.name];
      await db.dish.create({
        data: {
          restaurantId: resto.id,
          categoryId: cat.id,
          name: dish.name,
          nameEn: en?.name ?? null,
          description: dish.description,
          descriptionEn: en?.description ?? null,
          priceCents: dish.priceCents,
          photoUrl: dish.photo,
          videoUrl: dish.video ?? clip(clipIdx++),
          badge: dish.badge ?? null,
          optionsJson: JSON.stringify(DISH_OPTIONS[dish.name] ?? []),
          allergens: JSON.stringify(dish.allergens ?? []),
          diets: JSON.stringify(dish.diets ?? []),
          available: dish.available ?? true,
          position: d,
        },
      });
    }
  }

  // --- Données d'activité de démo (pour que les stats ne soient pas vides) ---
  const allDishes = await db.dish.findMany({ where: { restaurantId: resto.id } });
  const tables = await db.diningTable.findMany({ where: { restaurantId: resto.id } });

  // Événements de vues vidéo + ajouts panier, répartis (les plats populaires en tête)
  const events: { restaurantId: string; dishId: string; type: string }[] = [];
  allDishes.forEach((d, i) => {
    const views = 40 - i * 2 + ((i * 7) % 11); // volumétrie variée mais déterministe
    const carts = Math.round(views * (0.15 + ((i * 3) % 5) / 20));
    for (let v = 0; v < views; v++)
      events.push({ restaurantId: resto.id, dishId: d.id, type: "VIDEO_VIEW" });
    for (let c = 0; c < carts; c++)
      events.push({ restaurantId: resto.id, dishId: d.id, type: "ADD_TO_CART" });
  });
  await db.analyticsEvent.createMany({ data: events });

  // Quelques commandes passées (statuts variés) pour le tableau de bord
  const statuses = ["RECEIVED", "PREPARING", "READY", "SERVED", "SERVED"];
  for (let o = 0; o < 8; o++) {
    const picks = [allDishes[o % allDishes.length], allDishes[(o + 3) % allDishes.length]];
    const lines = picks
      .filter((d) => d.available)
      .map((d) => ({
        dishId: d.id,
        nameSnapshot: d.name,
        unitPriceCents: d.priceCents,
        quantity: 1 + (o % 2),
      }));
    const total = lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);
    await db.order.create({
      data: {
        restaurantId: resto.id,
        tableId: tables[o % tables.length].id,
        status: statuses[o % statuses.length],
        totalCents: total,
        items: { create: lines },
      },
    });
    await db.analyticsEvent.createMany({
      data: lines.map((l) => ({ restaurantId: resto.id, dishId: l.dishId, type: "ORDER" })),
    });
  }

  const count = await db.dish.count();
  console.log(`✅ Démo prête : "${resto.name}" — ${count} plats, 10 tables.`);
  console.log(`   Menu convive : /r/chez-marco/t/3`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
