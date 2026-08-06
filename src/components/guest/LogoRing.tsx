"use client";

// Logo entouré de texte incurvé qui suit son bord (façon sceau).
// Les libellés sont répartis harmonieusement selon leur nombre.
type Item = { label: string; onClick: () => void };

// Position de chaque libellé : arc (haut/bas) + décalage le long de l'arc.
const LAYOUTS: Record<number, [ "ringTop" | "ringBot", string ][]> = {
  1: [["ringTop", "50%"]],
  2: [["ringTop", "50%"], ["ringBot", "50%"]],
  3: [["ringTop", "50%"], ["ringBot", "20%"], ["ringBot", "80%"]],
  4: [["ringTop", "25%"], ["ringTop", "75%"], ["ringBot", "25%"], ["ringBot", "75%"]],
};

export function LogoRing({
  logoUrl,
  name,
  items,
}: {
  logoUrl: string | null;
  name: string;
  items: Item[];
}) {
  const layout = LAYOUTS[items.length] ?? LAYOUTS[4];
  const style = {
    fontSize: "11px",
    fill: "var(--brand)",
    letterSpacing: "1.5px",
  } as const;

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
          {/* Arc du haut (même rayon que le bas → 3 mots à distance égale du logo) */}
          <path id="ringTop" d="M 38,128 A 90,90 0 0 1 218,128" fill="none" />
          {/* Arc du bas (bombé vers le bas) : texte lisible en dessous */}
          <path id="ringBot" d="M 38,128 A 90,90 0 0 0 218,128" fill="none" />
        </defs>

        {items.map((it, i) => {
          const [path, offset] = layout[i] ?? ["ringTop", "50%"];
          return (
            <text
              key={i}
              className="cursor-pointer uppercase font-semibold active:opacity-70"
              style={style}
              textLength={96}
              lengthAdjust="spacing"
              onClick={it.onClick}
            >
              <textPath href={`#${path}`} startOffset={offset} textAnchor="middle">
                {it.label}
              </textPath>
            </text>
          );
        })}
      </svg>
    </div>
  );
}
