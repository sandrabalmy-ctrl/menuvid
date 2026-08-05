// Écran d'accueil « BIENVENUE » : le convive choisit Boire ou Manger avant
// d'entrer dans la carte (identité Amazonia Dakar).
//
// ⚠️ Robustesse : les choix sont de vrais LIENS (<a href="?vue=…">), pas des
// boutons JavaScript. La page se recharge côté serveur avec le bon menu — ça
// fonctionne même si l'hydratation React échoue sur certains Safari.
export function IntroScreen({
  restaurantName,
  logoUrl,
  lang,
}: {
  restaurantName: string;
  logoUrl: string | null;
  lang: "fr" | "en";
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg px-6 text-center animate-fade-in">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={restaurantName}
          className="mb-6 max-h-64 w-auto rounded-3xl object-contain shadow-2xl shadow-black/50"
        />
      ) : (
        <h1 className="mb-6 font-display text-4xl font-semibold uppercase tracking-wide text-brand">
          {restaurantName}
        </h1>
      )}

      <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-brand">
        {lang === "en" ? "Welcome" : "Bienvenue"}
      </h2>
      <p className="mt-3 text-lg text-muted">
        {lang === "en"
          ? "What would you like?"
          : "Qu’est-ce qui vous ferait plaisir ?"}
      </p>

      <div className="mt-10 flex w-full max-w-xs flex-col gap-4">
        <a
          href="?vue=boire"
          className="w-full rounded-full bg-brand px-6 py-4 text-center text-lg font-semibold uppercase tracking-wide text-white transition active:scale-[0.98]"
        >
          {lang === "en" ? "Drink" : "Boire"}
        </a>
        <a
          href="?vue=manger"
          className="w-full rounded-full bg-brand px-6 py-4 text-center text-lg font-semibold uppercase tracking-wide text-white transition active:scale-[0.98]"
        >
          {lang === "en" ? "Eat" : "Manger"}
        </a>
      </div>
    </div>
  );
}
