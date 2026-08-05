// Internationalisation (FR/EN) du parcours convive.

export type Lang = "fr" | "en";

// Choisit la version traduite si elle existe, sinon revient au français.
export function pick(lang: Lang, fr: string, en?: string | null) {
  return lang === "en" && en && en.trim() ? en : fr;
}

const DICT = {
  fr: {
    consultOnly: "Consultez le menu — pour commander, demandez à votre serveur.",
    all: "Tout",
    callWaiter: "Appeler le serveur",
    bill: "Demander l'addition",
    waiterSent: "Serveur prévenu",
    billSent: "Addition demandée",
    viewOrder: "Voir ma commande",
    myOrder: "Ma commande",
    total: "Total",
    subtotal: "Sous-total",
    tip: "Pourboire",
    addTip: "Ajouter un pourboire ?",
    none: "Aucun",
    order: "Commander",
    sending: "Envoi en cuisine…",
    sentToKitchen: "Votre commande sera envoyée directement en cuisine.",
    add: "Ajouter",
    unavailable: "Indisponible aujourd'hui",
    unavailableNow: "Ce plat est indisponible pour le moment.",
    video: "vidéo",
    table: "Table",
    noDishForDiet: "Aucun plat pour ce régime.",
    giftCta: "Laissez un avis et gagnez un cadeau",
    orderSent: "Commande envoyée en cuisine",
    ready: "C'est prêt !",
    cancelled: "Commande annulée",
    yourOrder: "Votre commande",
    backToMenu: "Retour au menu",
    stReceived: "Reçue",
    stPreparing: "En préparation",
    stReady: "Prête",
    stServed: "Servie",
    note: "Une précision ? (ex. sans oignon, cuisson à point…)",
  },
  en: {
    consultOnly: "Browse the menu — to order, please ask your server.",
    all: "All",
    callWaiter: "Call the waiter",
    bill: "Ask for the bill",
    waiterSent: "Waiter notified",
    billSent: "Bill requested",
    viewOrder: "View my order",
    myOrder: "My order",
    total: "Total",
    subtotal: "Subtotal",
    tip: "Tip",
    addTip: "Add a tip?",
    none: "None",
    order: "Place order",
    sending: "Sending to kitchen…",
    sentToKitchen: "Your order will be sent straight to the kitchen.",
    add: "Add",
    unavailable: "Unavailable today",
    unavailableNow: "This dish is currently unavailable.",
    video: "video",
    table: "Table",
    noDishForDiet: "No dish for this diet.",
    giftCta: "Leave a review & win a gift",
    orderSent: "Order sent to the kitchen",
    ready: "It's ready!",
    cancelled: "Order cancelled",
    yourOrder: "Your order",
    backToMenu: "Back to menu",
    stReceived: "Received",
    stPreparing: "Preparing",
    stReady: "Ready",
    stServed: "Served",
    note: "Any note? (e.g. no onion, medium-rare…)",
  },
} as const;

export type StringKey = keyof (typeof DICT)["fr"];

export function t(lang: Lang, key: StringKey): string {
  return DICT[lang][key];
}
