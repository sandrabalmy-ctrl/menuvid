"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ALLERGENS, DIETS } from "@/lib/labels";
import type { OptionGroup } from "@/lib/options";
import { DishOptionsEditor } from "./DishOptionsEditor";

type Category = { id: string; name: string };
type Initial = {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  priceEuros: string;
  categoryId: string;
  photoUrl: string;
  videoUrl: string;
  badge: string;
  options: OptionGroup[];
  allergens: string[];
  diets: string[];
  available: boolean;
};

export function DishForm({
  mode,
  categories,
  hasVideo,
  initial,
}: {
  mode: "new" | "edit";
  categories: Category[];
  hasVideo: boolean;
  initial?: Initial;
}) {
  const router = useRouter();
  const [f, setF] = useState<Initial>(
    initial ?? {
      id: "",
      name: "",
      nameEn: "",
      description: "",
      descriptionEn: "",
      priceEuros: "",
      categoryId: categories[0]?.id ?? "",
      photoUrl: "",
      videoUrl: "",
      badge: "",
      options: [],
      allergens: [],
      diets: [],
      available: true,
    }
  );
  const [newCategoryName, setNewCategoryName] = useState("");
  const [saving, setSaving] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function uploadFile(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "Envoi impossible.");
    return j.url as string;
  }

  async function onPhotoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    setError(null);
    try {
      const url = await uploadFile(file);
      setF((s) => ({ ...s, photoUrl: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible.");
    } finally {
      setPhotoUploading(false);
      e.target.value = "";
    }
  }

  async function onVideoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoUploading(true);
    setError(null);
    setNotice(null);
    try {
      const url = await uploadFile(file);
      setF((s) => ({ ...s, videoUrl: url }));
      setNotice("Vidéo importée.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible.");
    } finally {
      setVideoUploading(false);
      e.target.value = "";
    }
  }

  function toggle(list: "allergens" | "diets", key: string) {
    setF((s) => ({
      ...s,
      [list]: s[list].includes(key)
        ? s[list].filter((k) => k !== key)
        : [...s[list], key],
    }));
  }

  async function generateVideo() {
    if (!f.photoUrl) {
      setError("Ajoutez d'abord l'URL d'une photo pour générer la vidéo.");
      return;
    }
    setGenLoading(true);
    setError(null);
    setNotice(null);
    const res = await fetch("/api/video/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: f.photoUrl }),
    });
    const j = await res.json();
    if (res.ok) {
      setF((s) => ({ ...s, videoUrl: j.videoUrl }));
      setNotice(j.message || "Vidéo générée.");
    } else {
      setError(j.error || "Génération impossible.");
    }
    setGenLoading(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      name: f.name,
      nameEn: f.nameEn,
      description: f.description,
      descriptionEn: f.descriptionEn,
      priceEuros: f.priceEuros,
      categoryId: newCategoryName ? "" : f.categoryId,
      newCategoryName,
      photoUrl: f.photoUrl,
      videoUrl: f.videoUrl,
      badge: f.badge,
      options: f.options,
      allergens: f.allergens,
      diets: f.diets,
      available: f.available,
    };
    const res = await fetch(
      mode === "new" ? "/api/dishes" : `/api/dishes/${f.id}`,
      {
        method: mode === "new" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (res.ok) {
      router.push("/dashboard/menu");
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Enregistrement impossible.");
      setSaving(false);
    }
  }

  const input =
    "w-full rounded-xl bg-surface px-4 py-3 outline-none focus:ring-2 focus:ring-brand";

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="mb-1 block text-sm text-muted">Nom du plat</label>
        <input
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })}
          className={input}
          placeholder="ex. Burger signature"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted">Description</label>
        <textarea
          value={f.description}
          onChange={(e) => setF({ ...f, description: e.target.value })}
          rows={2}
          className={input}
          placeholder="Ingrédients, particularités…"
        />
      </div>

      {/* Traduction anglaise (facultatif) — affichée aux clients qui choisissent EN */}
      <div className="rounded-2xl border border-border p-4">
        <p className="mb-2 text-sm font-medium">🇬🇧 Traduction anglaise (facultatif)</p>
        <input
          value={f.nameEn}
          onChange={(e) => setF({ ...f, nameEn: e.target.value })}
          className={input}
          placeholder="Dish name in English"
        />
        <textarea
          value={f.descriptionEn}
          onChange={(e) => setF({ ...f, descriptionEn: e.target.value })}
          rows={2}
          className={`${input} mt-2`}
          placeholder="Description in English"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm text-muted">Prix (€)</label>
          <input
            type="number"
            step="0.10"
            min="0"
            value={f.priceEuros}
            onChange={(e) => setF({ ...f, priceEuros: e.target.value })}
            className={input}
            placeholder="16.90"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Catégorie</label>
          <select
            value={newCategoryName ? "" : f.categoryId}
            onChange={(e) => {
              setF({ ...f, categoryId: e.target.value });
              setNewCategoryName("");
            }}
            className={input}
            disabled={!!newCategoryName}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted">
          …ou nouvelle catégorie
        </label>
        <input
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          className={input}
          placeholder="ex. Menu enfant (laisser vide sinon)"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted">
          Mise en avant (facultatif)
        </label>
        <select
          value={f.badge}
          onChange={(e) => setF({ ...f, badge: e.target.value })}
          className={input}
        >
          <option value="">Aucune</option>
          <option value="populaire">⭐ Populaire</option>
          <option value="coup-de-coeur">❤️ Coup de cœur</option>
          <option value="plat-du-jour">📅 Plat du jour</option>
        </select>
      </div>

      {/* Photo */}
      <div>
        <label className="mb-1 block text-sm text-muted">Photo du plat</label>
        <div className="flex flex-wrap items-center gap-2">
          <label className="cursor-pointer rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white">
            {photoUploading ? "Envoi…" : "📷 Choisir une photo"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPhotoFile}
              disabled={photoUploading}
            />
          </label>
          {f.photoUrl && (
            <button
              type="button"
              onClick={() => setF({ ...f, photoUrl: "" })}
              className="text-sm text-muted hover:text-red-400"
            >
              Retirer
            </button>
          )}
        </div>
        <input
          value={f.photoUrl}
          onChange={(e) => setF({ ...f, photoUrl: e.target.value })}
          className={`${input} mt-2`}
          placeholder="…ou coller une URL d'image"
        />
        {f.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={f.photoUrl}
            alt=""
            className="mt-2 h-32 w-32 rounded-xl object-cover"
          />
        )}
      </div>

      {/* Vidéo (selon le palier) */}
      {hasVideo ? (
        <div className="rounded-2xl border border-border p-4">
          <label className="mb-1 block text-sm font-medium">
            Vidéo du plat 🎬
          </label>
          <p className="mb-3 text-xs text-muted">
            Générez une vidéo depuis la photo, ou collez l’URL de votre propre
            clip vertical.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={generateVideo}
              disabled={genLoading}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {genLoading ? "Génération…" : "✨ Générer depuis la photo (IA)"}
            </button>
            <label className="cursor-pointer rounded-lg bg-surface-2 px-4 py-2 text-sm font-medium">
              {videoUploading ? "Envoi…" : "🎞️ Uploader ma vidéo"}
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={onVideoFile}
                disabled={videoUploading}
              />
            </label>
            {f.videoUrl && (
              <button
                type="button"
                onClick={() => setF({ ...f, videoUrl: "" })}
                className="px-2 py-2 text-sm text-muted hover:text-red-400"
              >
                Retirer
              </button>
            )}
          </div>
          <input
            value={f.videoUrl}
            onChange={(e) => setF({ ...f, videoUrl: e.target.value })}
            className={`${input} mt-3`}
            placeholder="…ou coller l'URL d'un clip .mp4"
          />
          {f.videoUrl && (
            <video
              src={f.videoUrl}
              muted
              loop
              autoPlay
              playsInline
              className="mt-2 h-40 w-24 rounded-xl object-cover"
            />
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-border p-4 text-sm text-muted">
          🎬 La vidéo par plat est disponible à partir du palier <b>Vidéo</b>.
        </div>
      )}

      <DishOptionsEditor
        value={f.options}
        onChange={(options) => setF({ ...f, options })}
      />

      {/* Régimes */}
      <div>
        <label className="mb-2 block text-sm text-muted">Régimes</label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(DIETS).map(([key, v]) => (
            <button
              type="button"
              key={key}
              onClick={() => toggle("diets", key)}
              className={`rounded-full px-3 py-1.5 text-sm ${
                f.diets.includes(key)
                  ? "bg-emerald-500/25 text-emerald-200"
                  : "bg-surface text-muted"
              }`}
            >
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Allergènes */}
      <div>
        <label className="mb-2 block text-sm text-muted">Allergènes</label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(ALLERGENS).map(([key, v]) => (
            <button
              type="button"
              key={key}
              onClick={() => toggle("allergens", key)}
              className={`rounded-full px-3 py-1.5 text-sm ${
                f.allergens.includes(key)
                  ? "bg-white/20 text-text"
                  : "bg-surface text-muted"
              }`}
            >
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={f.available}
          onChange={(e) => setF({ ...f, available: e.target.checked })}
          className="h-5 w-5 accent-[var(--brand)]"
        />
        <span>Disponible (décochez en cas de rupture)</span>
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {notice && <p className="text-sm text-emerald-300">{notice}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-brand px-6 py-3 font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard/menu")}
          className="rounded-xl bg-surface px-6 py-3"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
