// Politique de mot de passe : longueur suffisante + une lettre + un chiffre,
// et rejet des mots de passe les plus courants. Appliquée à chaque définition
// ou réinitialisation de mot de passe (restaurateur, équipe, client).

const COMMON = new Set([
  "password",
  "password1",
  "motdepasse",
  "motdepasse1",
  "12345678",
  "123456789",
  "1234567890",
  "azerty123",
  "azertyuiop",
  "qwerty123",
  "qwertyuiop",
  "00000000",
  "11111111",
  "demo1234",
  "admin1234",
]);

export function validatePassword(
  pw: unknown
): { ok: true } | { ok: false; error: string } {
  if (typeof pw !== "string") {
    return { ok: false, error: "Mot de passe manquant." };
  }
  if (pw.length < 8) {
    return { ok: false, error: "Mot de passe trop court (8 caractères minimum)." };
  }
  if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) {
    return {
      ok: false,
      error: "Le mot de passe doit contenir au moins une lettre et un chiffre.",
    };
  }
  if (COMMON.has(pw.toLowerCase())) {
    return {
      ok: false,
      error: "Mot de passe trop courant. Choisissez-en un moins évident.",
    };
  }
  return { ok: true };
}
