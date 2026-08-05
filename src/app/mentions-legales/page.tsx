import { LegalShell, LegalH2 } from "@/components/legal/LegalShell";

export const metadata = { title: "Mentions légales — MenuVid" };

export default function MentionsLegales() {
  return (
    <LegalShell title="Mentions légales" updated="[à compléter]">
      <LegalH2>Éditeur du site</LegalH2>
      <p>
        Le présent site est édité par <b>[Nom de la société / de l’entrepreneur]</b>,
        [forme juridique — ex. SAS, auto-entrepreneur], au capital de [montant] €,
        immatriculée au RCS de [ville] sous le numéro [SIREN/SIRET].
        <br />
        Siège social : [adresse complète].
        <br />
        N° de TVA intracommunautaire : [FR…].
        <br />
        Directeur de la publication : [Prénom Nom].
        <br />
        Contact : [email] — [téléphone].
      </p>

      <LegalH2>Hébergement</LegalH2>
      <p>
        Le site est hébergé par [Hébergeur — ex. Vercel Inc., 340 S Lemon Ave
        #4133, Walnut, CA 91789, USA] et la base de données par [ex. Neon].
        Le stockage des médias est assuré par [ex. Cloudflare].
      </p>

      <LegalH2>Propriété intellectuelle</LegalH2>
      <p>
        L’ensemble des contenus (textes, visuels, vidéos, marques) est protégé.
        Les photos et vidéos des plats restent la propriété des restaurants
        clients. Toute reproduction sans autorisation est interdite.
      </p>

      <LegalH2>Contact</LegalH2>
      <p>
        Pour toute question : [email de contact].
      </p>
    </LegalShell>
  );
}
