"use client";

// Logo entouré de texte incurvé qui suit son bord (façon sceau).
// 4 libellés cliquables, sans rond : 2 sur l'arc du haut, 2 sur l'arc du bas.
type Item = { label: string; onClick: () => void };

export function LogoRing({
  logoUrl,
  name,
  items,
}: {
  logoUrl: string | null;
  name: string;
  items: Item[]; // ordre : [haut-gauche, haut-droite, bas-gauche, bas-droite]
}) {
  const [tl, tr, bl, br] = items;

  const textCls =
    "cursor-pointer uppercase tracking-[0.22em] font-semibold active:opacity-70";
  const style = { fontSize: "12px", fill: "var(--brand)" } as const;

  return (
    <div className="relative mx-auto h-64 w-64">
      {/* Logo au centre */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={name}
            className="h-28 w-28 rounded-2xl object-contain shadow-xl shadow-black/40 ring-2 ring-brand/40"
          />
        ) : (
          <span className="font-display text-3xl font-semibold text-brand">
            {name}
          </span>
        )}
      </div>

      {/* Texte incurvé autour */}
      <svg viewBox="0 0 256 256" className="absolute inset-0 h-full w-full">
        <defs>
          {/* Arc du haut (bombé vers le haut) : texte lisible au-dessus */}
          <path
            id="ringTop"
            d="M 38,128 A 90,90 0 0 1 218,128"
            fill="none"
          />
          {/* Arc du bas (bombé vers le bas) : texte lisible en dessous */}
          <path
            id="ringBot"
            d="M 38,128 A 90,90 0 0 0 218,128"
            fill="none"
          />
        </defs>

        {tl && (
          <text className={textCls} style={style} onClick={tl.onClick}>
            <textPath href="#ringTop" startOffset="25%" textAnchor="middle">
              {tl.label}
            </textPath>
          </text>
        )}
        {tr && (
          <text className={textCls} style={style} onClick={tr.onClick}>
            <textPath href="#ringTop" startOffset="75%" textAnchor="middle">
              {tr.label}
            </textPath>
          </text>
        )}
        {bl && (
          <text className={textCls} style={style} onClick={bl.onClick}>
            <textPath href="#ringBot" startOffset="25%" textAnchor="middle">
              {bl.label}
            </textPath>
          </text>
        )}
        {br && (
          <text className={textCls} style={style} onClick={br.onClick}>
            <textPath href="#ringBot" startOffset="75%" textAnchor="middle">
              {br.label}
            </textPath>
          </text>
        )}
      </svg>
    </div>
  );
}
