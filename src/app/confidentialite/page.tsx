import { LegalShell, LegalH2 } from "@/components/legal/LegalShell";

export const metadata = { title: "Politique de confidentialité — MenuVid" };

export default function Confidentialite() {
  return (
    <LegalShell title="Politique de confidentialité" updated="[à compléter]">
      <p>
        Cette politique explique quelles données sont traitées lorsque vous
        utilisez MenuVid, conformément au Règlement Général sur la Protection des
        Données (RGPD).
      </p>

      <LegalH2>Responsable de traitement</LegalH2>
      <p>
        [Nom de la société], [adresse]. Contact : [email]. Délégué à la protection
        des données (le cas échéant) : [email DPO].
      </p>

      <LegalH2>Données collectées</LegalH2>
      <p>
        <b>Restaurateurs (comptes) :</b> adresse email et mot de passe (chiffré),
        informations du restaurant, données d’abonnement (via notre prestataire de
        paiement).
        <br />
        <b>Convives (clients) :</b> aucune création de compte n’est requise. Nous
        traitons uniquement les informations liées à une commande (numéro de table,
        plats commandés, note éventuelle) et des statistiques d’usage anonymes
        (nombre de vues d’un plat), non rattachées à une personne identifiée.
      </p>

      <LegalH2>Finalités et base légale</LegalH2>
      <p>
        Fournir le service (exécution du contrat) : gestion des menus, des
        commandes et des abonnements. Amélioration du service (intérêt légitime) :
        statistiques agrégées. Aucune donnée n’est utilisée à des fins publicitaires.
      </p>

      <LegalH2>Destinataires</LegalH2>
      <p>
        Prestataires strictement nécessaires : hébergement ([ex. Vercel/Neon]),
        stockage des médias ([ex. Cloudflare]), paiement des abonnements ([Stripe]),
        envoi d’emails ([ex. Resend]). Aucune revente de données à des tiers.
      </p>

      <LegalH2>Durée de conservation</LegalH2>
      <p>
        Comptes restaurateurs : durée de la relation contractuelle + [durée légale].
        Commandes : [durée] à des fins comptables. Statistiques : forme agrégée.
      </p>

      <LegalH2>Vos droits</LegalH2>
      <p>
        Vous disposez des droits d’accès, de rectification, d’effacement, de
        limitation, d’opposition et de portabilité. Pour les exercer : [email].
        Vous pouvez également introduire une réclamation auprès de la CNIL
        (www.cnil.fr).
      </p>

      <LegalH2>Cookies et stockage local</LegalH2>
      <p>
        MenuVid n’utilise que des cookies et un stockage local <b>essentiels au
        fonctionnement</b> : cookie de session (connexion restaurateur), et stockage
        local pour le panier, la langue choisie et la participation à la roue des
        cadeaux. <b>Aucun traceur publicitaire ni cookie tiers de suivi.</b>
      </p>
    </LegalShell>
  );
}
