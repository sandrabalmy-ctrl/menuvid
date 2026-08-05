// ============================================================================
//  Envoi d'email — modulaire.
//  Sans clé configurée (démo locale) : on n'envoie rien, on journalise le
//  contenu (le lien apparaît dans la console du serveur).
//  Mise en ligne : renseigner RESEND_API_KEY + MAIL_FROM dans .env et l'envoi
//  réel se fait via Resend. Aucun autre changement dans l'app.
// ============================================================================

export function isMailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ sent: boolean }> {
  if (!isMailConfigured()) {
    // Démo : on n'envoie pas, on montre le contenu côté serveur.
    console.log(
      `\n[MAIL — non envoyé, mode démo]\n  À: ${opts.to}\n  Objet: ${opts.subject}\n  ${opts.text ?? ""}\n`
    );
    return { sent: false };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    }),
  });
  return { sent: res.ok };
}
