import { LegalShell, LegalH2 } from "@/components/legal/LegalShell";

export const metadata = { title: "Conditions générales — MenuVid" };

export default function CGV() {
  return (
    <LegalShell
      title="Conditions générales de vente et d’utilisation"
      updated="[à compléter]"
    >
      <LegalH2>Objet</LegalH2>
      <p>
        Les présentes conditions régissent l’abonnement au service MenuVid
        (menu digital, vidéos, prise de commande) proposé aux restaurants par
        [Nom de la société].
      </p>

      <LegalH2>Abonnement et paliers</LegalH2>
      <p>
        Le service est proposé par abonnement mensuel sans engagement, selon les
        paliers en vigueur (Essentiel, Vidéo, Commande). Les prix sont indiqués
        hors taxes / toutes taxes comprises [à préciser]. Des frais de mise en
        place ponctuels peuvent s’appliquer.
      </p>

      <LegalH2>Paiement</LegalH2>
      <p>
        Le paiement est effectué mensuellement via notre prestataire sécurisé
        [Stripe]. Le service peut être suspendu en cas de défaut de paiement.
      </p>

      <LegalH2>Résiliation</LegalH2>
      <p>
        L’abonnement peut être résilié à tout moment ; il prend fin à l’échéance
        de la période en cours. [Précisez vos modalités de remboursement.]
      </p>

      <LegalH2>Responsabilités</LegalH2>
      <p>
        Le restaurant est responsable du contenu qu’il publie (photos, vidéos,
        prix, allergènes) et de la conformité de son offre. [Nom de la société]
        s’engage à fournir le service avec diligence, sans garantie de
        disponibilité absolue.
      </p>

      <LegalH2>Données personnelles</LegalH2>
      <p>
        Le traitement des données est décrit dans notre{" "}
        <a href="/confidentialite" className="text-brand underline">
          politique de confidentialité
        </a>
        .
      </p>

      <LegalH2>Droit applicable</LegalH2>
      <p>
        Les présentes conditions sont soumises au droit français. Tout litige
        relève des tribunaux compétents de [ville].
      </p>
    </LegalShell>
  );
}
