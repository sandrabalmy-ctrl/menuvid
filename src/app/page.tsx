import Link from "next/link";

const SPACES = [
  {
    n: "1",
    icon: "👤",
    title: "Le client",
    subtitle: "Ce que voit un convive qui scanne le QR à sa table.",
    points: [
      "Menu vidéo immersif + fiche plein écran",
      "Filtres régimes, badges, allergènes",
      "🎁 Roue des cadeaux (avis Google)",
      "Panier, pourboire & suivi temps réel",
    ],
    href: "/r/chez-marco/t/3",
    cta: "Ouvrir le menu client",
    creds: null as string | null,
  },
  {
    n: "2",
    icon: "👨‍🍳",
    title: "Le restaurateur",
    subtitle: "Le back-office pour tout piloter.",
    points: [
      "Menu (upload photo/vidéo, génération IA)",
      "Commandes en direct 🔔 + demandes de service",
      "Tables & QR codes, statistiques",
      "Apparence, langues, abonnement",
    ],
    href: "/connexion",
    cta: "Espace restaurateur",
    creds: "marco@demo.fr · demo1234",
  },
  {
    n: "3",
    icon: "🛠️",
    title: "Votre espace",
    subtitle: "Le super-admin de la plateforme.",
    points: [
      "Gérer vos restaurants clients",
      "Créer un restaurant en un formulaire",
      "Paliers, statuts & revenu mensuel (MRR)",
    ],
    href: "/connexion",
    cta: "Espace super-admin",
    creds: "admin@menuvid.fr · admin1234",
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      {/* Hero */}
      <div className="text-center">
        <span className="inline-block rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
          Démo interactive
        </span>
        <h1 className="font-display mt-4 text-5xl font-semibold leading-none">
          MenuVid
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted">
          Le menu digital vidéo par QR code. Explorez les trois espaces du
          produit.
        </p>
      </div>

      {/* Espaces */}
      <div className="mt-10 space-y-4">
        {SPACES.map((s) => (
          <section
            key={s.n}
            className="group rounded-[28px] border border-border bg-surface p-6 transition hover:border-brand/50"
          >
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-surface-2 text-2xl">
                {s.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-xs font-semibold text-brand">
                    {s.n}
                  </span>
                  <h2 className="font-display text-2xl font-semibold">
                    {s.title}
                  </h2>
                </div>
                <p className="mt-0.5 text-sm text-muted">{s.subtitle}</p>

                <ul className="mt-3 space-y-1.5">
                  {s.points.map((p) => (
                    <li
                      key={p}
                      className="flex items-start gap-2 text-sm text-muted"
                    >
                      <span className="mt-0.5 text-brand">›</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>

                {s.creds && (
                  <p className="mt-3 inline-block rounded-lg bg-surface-2 px-3 py-1.5 font-mono text-xs text-muted">
                    {s.creds}
                  </p>
                )}

                <div className="mt-4">
                  <Link
                    href={s.href}
                    className="inline-flex items-center gap-1 rounded-full bg-brand px-6 py-3 font-semibold text-white transition active:scale-[0.98]"
                  >
                    {s.cta}
                    <span className="transition group-hover:translate-x-0.5">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-muted">
        Pour changer d’espace, déconnectez-vous puis reconnectez-vous avec
        l’autre identifiant.
      </p>

      <footer className="mt-8 flex flex-wrap justify-center gap-4 border-t border-border pt-6 text-xs text-muted">
        <Link href="/mentions-legales" className="hover:text-text">
          Mentions légales
        </Link>
        <Link href="/confidentialite" className="hover:text-text">
          Confidentialité
        </Link>
        <Link href="/cgv" className="hover:text-text">
          CGV
        </Link>
      </footer>
    </main>
  );
}
