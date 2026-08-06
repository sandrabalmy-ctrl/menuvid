"use client";

import { useEffect, useMemo, useState } from "react";
import type { GiftConfig } from "@/lib/gift";
import { fireConfetti } from "@/lib/confetti";
import { useLang } from "./lang";

// Détecte un lot "perdant" (pas de confettis, message différent).
function isLosing(label: string) {
  return /rat[ée]|perdu|dommage|rejou|pas de chance|aucun|rien|retente/i.test(
    label
  );
}

const COLORS = ["#f43f5e", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"];
const R = 100;
const CX = 110;
const CY = 110;

// Arrondi déterministe : évite les écarts de virgule flottante entre le rendu
// serveur et le rendu navigateur (sinon React signale une erreur d'hydratation).
function round(n: number) {
  return Number(n.toFixed(3));
}
function polar(angleDeg: number, radius: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: round(CX + radius * Math.sin(a)), y: round(CY - radius * Math.cos(a)) };
}
function wedgePath(a0: number, a1: number) {
  const p0 = polar(a0, R);
  const p1 = polar(a1, R);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${CX},${CY} L${p0.x},${p0.y} A${R},${R} 0 ${large} 1 ${p1.x},${p1.y} Z`;
}
function pickIndex(prizes: { weight: number }[]) {
  const total = prizes.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (let i = 0; i < prizes.length; i++) {
    r -= prizes[i].weight;
    if (r <= 0) return i;
  }
  return prizes.length - 1;
}

// Petite roue dessinée pour le bouton flottant.
function MiniWheel() {
  const cx = 20,
    cy = 20,
    r = 17,
    n = 6;
  const pol = (a: number): [number, number] => [
    round(cx + r * Math.sin((a * Math.PI) / 180)),
    round(cy - r * Math.cos((a * Math.PI) / 180)),
  ];
  const seg = 360 / n;
  return (
    <svg viewBox="0 0 40 40" className="h-5 w-5">
      {Array.from({ length: n }).map((_, i) => {
        const [x0, y0] = pol(i * seg);
        const [x1, y1] = pol((i + 1) * seg);
        return (
          <path
            key={i}
            d={`M20,20 L${x0},${y0} A${r},${r} 0 0 1 ${x1},${y1} Z`}
            fill={COLORS[i]}
            stroke="#ffffff"
            strokeWidth="0.6"
          />
        );
      })}
      <circle cx="20" cy="20" r="3.2" fill="#fff" />
      <path d="M20 1 l3 5 h-6 z" fill="var(--brand)" stroke="#fff" strokeWidth="0.6" />
    </svg>
  );
}

export function GiftWheel({
  restaurantId,
  gift,
  gold = false,
}: {
  restaurantId: string;
  gift: GiftConfig;
  gold?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { lang, t } = useLang();
  if (!gift.enabled) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t("giftCta")}
        title={t("giftCta")}
        className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition active:scale-95 ${
          gold
            ? "border border-brand/60 bg-brand/10 text-brand ring-1 ring-brand/30"
            : "bg-surface font-medium shadow-sm ring-1 ring-border"
        }`}
      >
        <MiniWheel />
        <span>{lang === "en" ? "Rewards" : "Cadeaux"}</span>
      </button>
      {open && (
        <WheelModal
          restaurantId={restaurantId}
          gift={gift}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function WheelModal({
  restaurantId,
  gift,
  onClose,
}: {
  restaurantId: string;
  gift: GiftConfig;
  onClose: () => void;
}) {
  const prizes = gift.prizes;
  const seg = 360 / prizes.length;
  const storageKey = `menuvid:gift:${restaurantId}`;

  const [reviewed, setReviewed] = useState(!gift.googleReviewUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [won, setWon] = useState<string | null>(null);
  const [already, setAlready] = useState(false);

  // Une seule participation par appareil.
  useEffect(() => {
    try {
      const prev = localStorage.getItem(storageKey);
      if (prev) {
        setWon(prev);
        setAlready(true);
      }
    } catch {}
  }, [storageKey]);

  // Envoi de la capture d'écran de l'avis → débloque la roue + garde la preuve.
  async function uploadProof(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("restaurantId", restaurantId);
      const res = await fetch("/api/review-proof", { method: "POST", body: fd });
      if (res.ok) setReviewed(true);
      else {
        const j = await res.json().catch(() => ({}));
        setUploadError(j.error || "Envoi impossible.");
      }
    } catch {
      setUploadError("Envoi impossible.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const segments = useMemo(
    () =>
      prizes.map((p, i) => ({
        path: wedgePath(i * seg, (i + 1) * seg),
        color: COLORS[i % COLORS.length],
        label: p.label,
        mid: i * seg + seg / 2,
      })),
    [prizes, seg]
  );

  function spin() {
    if (spinning || won) return;
    const idx = pickIndex(prizes);
    const jitter = (Math.random() - 0.5) * seg * 0.6;
    const target = 360 * 6 + (360 - (idx * seg + seg / 2)) - jitter;
    setSpinning(true);
    setRotation(target);
    setTimeout(() => {
      const label = prizes[idx].label;
      setSpinning(false);
      setWon(label);
      if (!isLosing(label)) fireConfetti(); // 🎉 uniquement si vrai gain
      try {
        localStorage.setItem(storageKey, label);
      } catch {}
    }, 4300);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-5">
      <div className="absolute inset-0 bg-black/75" onClick={onClose} />

      <div className="relative w-full max-w-sm rounded-3xl border border-border bg-bg p-6 text-center animate-fade-in">
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-surface text-lg"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold">🎁 La roue des cadeaux</h2>
        {!won && (
          <p className="mt-1 text-sm text-muted">
            Laissez un avis Google, puis tournez la roue !
          </p>
        )}

        {/* La roue */}
        <div className="relative mx-auto mt-5 h-56 w-56">
          {/* Aiguille */}
          <div
            className="absolute left-1/2 top-0 z-10 -translate-x-1/2"
            style={{
              width: 0,
              height: 0,
              borderLeft: "12px solid transparent",
              borderRight: "12px solid transparent",
              borderTop: "20px solid var(--brand)",
            }}
          />
          <svg viewBox="0 0 220 220" className="h-full w-full">
            <g
              style={{
                transform: `rotate(${rotation}deg)`,
                transformOrigin: "110px 110px",
                transition: spinning
                  ? "transform 4.2s cubic-bezier(0.16,1,0.3,1)"
                  : "none",
              }}
            >
              {segments.map((s, i) => (
                <g key={i}>
                  <path d={s.path} fill={s.color} stroke="#00000022" />
                  <text
                    x={CX}
                    y={CY - R * 0.62}
                    transform={`rotate(${s.mid} ${CX} ${CY})`}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="600"
                    fill="#fff"
                  >
                    {s.label.length > 16 ? s.label.slice(0, 15) + "…" : s.label}
                  </text>
                </g>
              ))}
              <circle cx={CX} cy={CY} r={94} fill="none" stroke="#ffffff33" strokeWidth="4" />
            </g>
            <circle cx={CX} cy={CY} r="14" fill="var(--brand)" stroke="#fff" strokeWidth="3" />
          </svg>
        </div>

        {/* Actions / résultat */}
        <div className="mt-5">
          {won ? (
            <div className="rounded-2xl bg-surface p-4">
              {isLosing(won) ? (
                <>
                  <p className="text-sm text-muted">😅 Pas de chance cette fois</p>
                  <p className="mt-1 text-xl font-bold">{won}</p>
                  <p className="mt-2 text-xs text-muted">
                    Merci pour votre avis, revenez vite&nbsp;!
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted">
                    {already ? "Vous avez déjà gagné :" : "🎉 Vous avez gagné :"}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-brand">{won}</p>
                  <p className="mt-2 text-xs text-muted">
                    Montrez cet écran au personnel pour en profiter.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {gift.googleReviewUrl && !reviewed && (
                <>
                  <a
                    href={gift.googleReviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-2xl bg-surface px-4 py-3 text-center font-medium"
                  >
                    ① ⭐ Laisser un avis Google
                  </a>
                  <label className="block cursor-pointer rounded-2xl bg-surface px-4 py-3 text-center font-medium">
                    {uploading
                      ? "Envoi…"
                      : "② 📷 Envoyer la capture de mon avis"}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={uploadProof}
                      disabled={uploading}
                    />
                  </label>
                  {uploadError && (
                    <p className="text-xs text-red-500">{uploadError}</p>
                  )}
                  <p className="text-xs text-muted">
                    Laissez votre avis, faites une capture d’écran, puis
                    envoyez-la ici pour débloquer la roue.
                  </p>
                </>
              )}
              {reviewed && gift.googleReviewUrl && (
                <p className="rounded-xl bg-emerald-500/15 px-3 py-2 text-xs text-emerald-700">
                  Merci ! 🙏 Capture reçue — vous pouvez tourner la roue.
                </p>
              )}
              <button
                onClick={spin}
                disabled={spinning || !reviewed}
                className="w-full rounded-2xl bg-brand px-4 py-3.5 font-semibold text-white active:scale-[0.99] transition disabled:opacity-50"
              >
                {spinning
                  ? "La roue tourne…"
                  : reviewed
                    ? "🎡 Tourner la roue"
                    : "Envoyez votre capture ☝️"}
              </button>
              <p className="text-xs text-muted">Une seule participation par personne.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
