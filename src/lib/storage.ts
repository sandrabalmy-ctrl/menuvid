import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// ============================================================================
//  Stockage des fichiers uploadés (photos / vidéos de plats).
//  DÉMO LOCALE : on écrit dans public/uploads (servi directement par le site).
//  MISE EN LIGNE : remplacer le corps de saveUpload() par un envoi vers
//  Cloudflare R2 / S3 (et renvoyer l'URL du CDN). C'est le SEUL fichier à
//  changer — tout le reste de l'app manipule juste l'URL renvoyée.
//  ⚠️ Sur un hébergement serverless (Vercel), l'écriture disque n'est pas
//  persistante : le stockage cloud est requis en production.
// ============================================================================

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

// Extension déduite UNIQUEMENT du type reconnu (liste blanche). On n'utilise
// jamais le nom de fichier fourni par le client : un fichier nommé « x.html »
// pourrait sinon être servi comme page et exécuter du code (XSS stocké).
// Renvoie null si le type n'est pas dans la liste → l'appelant doit refuser.
export function extForType(type: string): string | null {
  return EXT_BY_TYPE[type] ?? null;
}

// Répertoire de stockage persistant (volume Railway) si défini, ex.
// MEDIA_DIR=/app/data/uploads. Servi par la route /media/[...].
// Sinon (dev/local) : public/uploads, servi statiquement à /uploads.
const MEDIA_DIR = process.env.MEDIA_DIR;

export async function saveUpload(opts: {
  data: Buffer;
  ext: string;
  restaurantId: string;
}): Promise<string> {
  const filename = `${randomUUID()}.${opts.ext}`;

  if (MEDIA_DIR) {
    const dir = path.join(MEDIA_DIR, opts.restaurantId);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), opts.data);
    return `/media/${opts.restaurantId}/${filename}`;
  }

  const dir = path.join(process.cwd(), "public", "uploads", opts.restaurantId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), opts.data);
  // URL publique servie par le site (dossier /public)
  return `/uploads/${opts.restaurantId}/${filename}`;
}
