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

export function extForType(type: string, fallbackName = ""): string {
  if (EXT_BY_TYPE[type]) return EXT_BY_TYPE[type];
  const fromName = fallbackName.split(".").pop()?.toLowerCase();
  return fromName && fromName.length <= 4 ? fromName : "bin";
}

export async function saveUpload(opts: {
  data: Buffer;
  ext: string;
  restaurantId: string;
}): Promise<string> {
  const filename = `${randomUUID()}.${opts.ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", opts.restaurantId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), opts.data);
  // URL publique servie par le site (dossier /public)
  return `/uploads/${opts.restaurantId}/${filename}`;
}
