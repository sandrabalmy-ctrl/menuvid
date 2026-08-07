import { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

// Sert les médias (photos/vidéos de plats) stockés sur le volume persistant.
// GET /media/<restaurantId>/<fichier>
const MEDIA_DIR = process.env.MEDIA_DIR;

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  if (!MEDIA_DIR) return new Response("Not found", { status: 404 });

  const { path: parts } = await params;
  // Anti path-traversal : segments simples uniquement (pas de "..", "/", "\").
  const safe = (parts ?? []).filter(
    (p) => p && p !== "." && p !== ".." && !p.includes("/") && !p.includes("\\")
  );
  if (safe.length === 0 || safe.length !== (parts ?? []).length) {
    return new Response("Bad request", { status: 400 });
  }

  const base = path.resolve(MEDIA_DIR);
  const full = path.resolve(base, ...safe);
  if (full !== base && !full.startsWith(base + path.sep)) {
    return new Response("Bad request", { status: 400 });
  }

  try {
    const data = await readFile(full);
    const ext = safe[safe.length - 1].split(".").pop()?.toLowerCase() ?? "";
    const type = CONTENT_TYPES[ext] ?? "application/octet-stream";
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
