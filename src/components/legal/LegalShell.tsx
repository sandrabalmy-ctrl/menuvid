import Link from "next/link";

// Gabarit commun des pages légales (mentions, confidentialité, CGV).
export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <Link href="/" className="text-sm text-muted hover:text-text">
        ← Accueil
      </Link>
      <h1 className="font-display mt-4 text-3xl font-semibold">{title}</h1>
      <p className="mt-1 text-xs text-muted">Dernière mise à jour : {updated}</p>

      <div className="mt-4 rounded-xl bg-amber-500/15 px-4 py-3 text-sm text-amber-700">
        ⚠️ <b>Modèle à compléter.</b> Remplacez les champs entre crochets par vos
        informations, et faites relire ce document par un professionnel du droit
        avant mise en ligne.
      </div>

      <article className="legal mt-6 space-y-5 text-sm leading-relaxed text-text">
        {children}
      </article>

      <div className="mt-10 flex flex-wrap gap-4 border-t border-border pt-6 text-sm text-muted">
        <Link href="/mentions-legales" className="hover:text-text">
          Mentions légales
        </Link>
        <Link href="/confidentialite" className="hover:text-text">
          Confidentialité
        </Link>
        <Link href="/cgv" className="hover:text-text">
          CGV
        </Link>
      </div>
    </main>
  );
}

// Petit titre de section réutilisable.
export function LegalH2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-6 text-lg font-semibold">{children}</h2>;
}
