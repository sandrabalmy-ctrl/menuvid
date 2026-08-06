"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MenuDTO, DishDTO, FormuleDTO } from "@/lib/menu";
import { CartProvider } from "./cart";
import { LangProvider, useLang } from "./lang";
import { DishCard } from "./DishCard";
import { DishSheet } from "./DishSheet";
import { FormuleSheet } from "./FormuleSheet";
import { IntroScreen } from "./IntroScreen";
import { CartBar } from "./CartBar";
import { GiftWheel } from "./GiftWheel";
import { LoyaltyCard } from "./LoyaltyCard";
import { ServiceButtons } from "./ServiceButtons";
import { ActionsHub } from "./ActionsHub";
import { FeedbackButton } from "./FeedbackButton";
import { initTrack } from "@/lib/track";
import { themeStyle } from "@/lib/themes";
import { dietLabel } from "@/lib/labels";
import { formatPrice } from "@/lib/format";
import { pick } from "@/lib/i18n";

export function MenuApp({
  menu,
  tableNumber,
  initialView = null,
}: {
  menu: MenuDTO;
  tableNumber: number | null;
  initialView?: "boire" | "manger" | null;
}) {
  return (
    <LangProvider>
      <MenuBody menu={menu} tableNumber={tableNumber} initialView={initialView} />
    </LangProvider>
  );
}

function MenuBody({
  menu,
  tableNumber,
  initialView,
}: {
  menu: MenuDTO;
  tableNumber: number | null;
  initialView: "boire" | "manger" | null;
}) {
  const { restaurant, features, gift, categories, formules } = menu;
  const { lang, setLang, t } = useLang();
  // Commande possible = palier l'autorise ET service ouvert
  const ordering = features.ordering && !menu.orderingPaused;
  const [active, setActive] = useState(categories[0]?.id ?? "");
  const [openDish, setOpenDish] = useState<DishDTO | null>(null);
  const [openFormule, setOpenFormule] = useState<FormuleDTO | null>(null);
  // Page « accès rapides » ouverte par le logo (logo au centre, 3 choix autour).
  const [hubOpen, setHubOpen] = useState(false);
  const [loyaltyOpen, setLoyaltyOpen] = useState(false);
  const [wheelOpen, setWheelOpen] = useState(false);
  // Écran d'accueil Boire/Manger : le choix vient de l'URL (?vue=…), pas d'un
  // état JS → fonctionne même si l'hydratation du navigateur échoue (Safari).
  const mealChoice = initialView;
  const [diet, setDiet] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const navRef = useRef<HTMLElement>(null);
  const [navH, setNavH] = useState(96);

  useEffect(() => {
    initTrack(restaurant.id);
  }, [restaurant.id]);

  // Mesure la hauteur de la barre de nav pour épingler les titres justo en dessous.
  useEffect(() => {
    const measure = () => {
      if (navRef.current) setNavH(navRef.current.offsetHeight);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [diet]);

  const availableDiets = useMemo(() => {
    const set = new Set<string>();
    categories.forEach((c) => c.dishes.forEach((d) => d.diets.forEach((x) => set.add(x))));
    return [...set];
  }, [categories]);

  const visibleCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    // Écran d'accueil : ne montrer que les catégories du choix Boire/Manger.
    let cats = categories;
    if (menu.introEnabled && mealChoice) {
      cats = cats.filter((c) => c.group === mealChoice);
    }
    if (!diet && !q) return cats;
    return cats
      .map((c) => ({
        ...c,
        dishes: c.dishes.filter((d) => {
          if (diet && !d.diets.includes(diet)) return false;
          if (!q) return true;
          const name = pick(lang, d.name, d.nameEn).toLowerCase();
          const desc = pick(lang, d.description, d.descriptionEn).toLowerCase();
          return name.includes(q) || desc.includes(q);
        }),
      }))
      .filter((c) => c.dishes.length > 0);
  }, [categories, diet, query, lang, menu.introEnabled, mealChoice]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.5, 1] }
    );
    Object.values(sectionRefs.current).forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [visibleCategories]);

  function scrollTo(id: string) {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Les formules s'affichent en tête de carte, hors recherche/filtre régime,
  // et côté « Manger » uniquement (ce sont des plats).
  const showFormules =
    formules.length > 0 &&
    !query.trim() &&
    !diet &&
    !(menu.introEnabled && mealChoice === "boire");

  const welcome = pick(lang, restaurant.welcomeMessage ?? "", restaurant.welcomeMessageEn);

  return (
    <CartProvider storageKey={`menuvid:cart:${restaurant.id}:${tableNumber ?? 0}`}>
      <div
        style={themeStyle(restaurant.theme, restaurant.brandColor)}
        className="min-h-screen"
      >
        <div className="mx-auto min-h-full max-w-md pb-28">
          {/* En-tête */}
          <header className="px-5 pt-8 pb-2">
            <div className="relative">
              {/* Langue + n° de table : en haut à droite (n'affecte pas le centrage) */}
              <div className="absolute right-0 top-0 z-10 flex flex-col items-end gap-2">
                {restaurant.offerEnglish && (
                  <div className="flex overflow-hidden rounded-full border border-border">
                    {(["fr", "en"] as const).map((l) => (
                      <button
                        key={l}
                        onClick={() => setLang(l)}
                        className={`px-2.5 py-1 text-xs font-semibold ${
                          lang === l ? "bg-brand text-white" : "bg-surface text-muted"
                        }`}
                      >
                        {l.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}
                {tableNumber != null && (
                  <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
                    {t("table")} {tableNumber}
                  </span>
                )}
              </div>

              {/* Logo cliquable — ouvre la page des accès (Fidélité / Cadeaux / Addition) */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => setHubOpen(true)}
                  aria-label={lang === "en" ? "Quick access" : "Accès rapides"}
                  className="rounded-[20px] ring-2 ring-brand/50 ring-offset-4 ring-offset-bg transition active:scale-95"
                >
                  {restaurant.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={restaurant.logoUrl}
                      alt={restaurant.name}
                      className="h-24 w-24 rounded-2xl object-contain shadow-lg shadow-black/40"
                    />
                  ) : (
                    <span className="block px-5 py-3 font-display text-4xl font-semibold text-brand">
                      {restaurant.name}
                    </span>
                  )}
                </button>

                {/* Indication dorée des accès (le logo mène à la page dédiée) */}
                {(menu.loyalty.enabled || gift.enabled || tableNumber != null) && (
                  <button
                    onClick={() => setHubOpen(true)}
                    className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand/80"
                  >
                    {[
                      menu.loyalty.enabled && `🎟️ ${lang === "en" ? "Loyalty" : "Fidélité"}`,
                      gift.enabled && `🎡 ${lang === "en" ? "Rewards" : "Cadeaux"}`,
                      tableNumber != null && `🧾 ${lang === "en" ? "Bill" : "Addition"}`,
                    ]
                      .filter(Boolean)
                      .join("  ·  ")}
                  </button>
                )}
              </div>
            </div>

            {/* Message d'accueil — calligraphie romantique, avant les actions */}
            {welcome && (
              <div className="mt-5 text-center">
                <p
                  className="whitespace-pre-line text-[24px] font-medium italic leading-[1.4] text-white"
                  style={{ fontFamily: "var(--font-script)" }}
                >
                  {welcome}
                </p>
                <div className="mt-2 flex items-center justify-center gap-2.5 text-brand/70">
                  <span className="h-px w-8 bg-brand/40" />
                  <span className="text-xs">❦</span>
                  <span className="h-px w-8 bg-brand/40" />
                </div>
              </div>
            )}

            {menu.orderingPaused ? (
              <p className="mt-3 rounded-xl bg-amber-500/15 px-3 py-2 text-sm font-medium text-amber-700">
                ⏸️{" "}
                {lang === "en"
                  ? "Ordering is closed right now."
                  : "Les commandes sont fermées pour le moment."}
              </p>
            ) : (
              !features.ordering && (
                <p className="mt-3 rounded-xl bg-surface px-3 py-2 text-xs text-muted">
                  {t("consultOnly")}
                </p>
              )
            )}

            {tableNumber != null && (
              <div className="mt-3">
                <ServiceButtons
                  restaurantId={restaurant.id}
                  tableNumber={tableNumber}
                  showBill={false}
                />
              </div>
            )}

            {/* Recherche dans la carte */}
            <div className="mt-4">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  lang === "en" ? "Search a dish…" : "Rechercher un plat…"
                }
                className="w-full rounded-full border border-border bg-surface/50 px-5 py-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-brand/50 focus:ring-2 focus:ring-brand/25"
              />
            </div>
          </header>

          {/* Navigation catégories (sticky) */}
          <nav
            ref={navRef}
            className="sticky top-0 z-20 bg-bg/80 px-3 pt-3 pb-2 backdrop-blur-md"
          >
            {/* Bascule Boire / Manger (liens = navigation réelle, robuste) */}
            {menu.introEnabled && mealChoice && (
              <div className="mb-2 flex gap-2">
                {(["manger", "boire"] as const).map((g) => (
                  <a
                    key={g}
                    href={`?vue=${g}`}
                    className={`flex-1 rounded-full px-4 py-1.5 text-center text-sm font-semibold uppercase tracking-wide transition ${
                      mealChoice === g
                        ? "bg-brand text-white"
                        : "bg-surface text-muted"
                    }`}
                  >
                    {g === "manger"
                      ? lang === "en"
                        ? "Eat"
                        : "Manger"
                      : lang === "en"
                        ? "Drink"
                        : "Boire"}
                  </a>
                ))}
              </div>
            )}

            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {showFormules && (
                <button
                  onClick={() => scrollTo("formules")}
                  className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] transition ${
                    active === "formules"
                      ? "border-brand bg-brand text-white shadow-lg shadow-brand/20"
                      : "border-border bg-transparent text-muted hover:border-brand/40 hover:text-text"
                  }`}
                >
                  {lang === "en" ? "Set menus" : "Formules"}
                </button>
              )}
              {visibleCategories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => scrollTo(c.id)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] transition ${
                    active === c.id
                      ? "border-brand bg-brand text-white shadow-lg shadow-brand/20"
                      : "border-border bg-transparent text-muted hover:border-brand/40 hover:text-text"
                  }`}
                >
                  {pick(lang, c.name, c.nameEn)}
                </button>
              ))}
            </div>

            {availableDiets.length > 0 && (
              <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
                <FilterChip active={diet === null} onClick={() => setDiet(null)}>
                  {t("all")}
                </FilterChip>
                {availableDiets.map((d) => (
                  <FilterChip
                    key={d}
                    active={diet === d}
                    onClick={() => setDiet(diet === d ? null : d)}
                  >
                    {dietLabel(d, lang).icon} {dietLabel(d, lang).label}
                  </FilterChip>
                ))}
              </div>
            )}
          </nav>

          {/* Fil des plats par catégorie */}
          <main className="space-y-9 px-4 pt-3">
            {/* Formules (menus à prix fixe) en tête de carte */}
            {showFormules && (
              <section
                id="formules"
                ref={(el) => {
                  sectionRefs.current["formules"] = el;
                }}
                style={{ scrollMarginTop: navH + 8 }}
              >
                <div
                  className="sticky z-10 -mx-4 mb-4 border-y border-border bg-bg/95 px-4 py-2.5 backdrop-blur"
                  style={{ top: navH }}
                >
                  <h2 className="flex items-center gap-2">
                    <span className="font-display text-2xl font-semibold">
                      📋 {lang === "en" ? "Set menus" : "Formules"}
                    </span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {formules.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setOpenFormule(f)}
                      className="rounded-2xl border border-border bg-surface p-4 text-left transition active:scale-[0.99]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-display text-xl font-semibold">
                            {pick(lang, f.name, f.nameEn)}
                          </p>
                          {pick(lang, f.description, f.descriptionEn) && (
                            <p className="mt-0.5 text-sm text-muted">
                              {pick(lang, f.description, f.descriptionEn)}
                            </p>
                          )}
                          <p className="mt-2 text-sm text-muted">
                            {f.steps
                              .map((s) => pick(lang, s.name, s.nameEn))
                              .join(" · ")}
                          </p>
                        </div>
                        <span className="shrink-0 font-semibold text-brand">
                          {formatPrice(f.priceCents, restaurant.currency)}
                        </span>
                      </div>
                      <span className="mt-3 inline-block rounded-full bg-brand/15 px-4 py-1.5 text-sm font-semibold text-brand">
                        {ordering
                          ? lang === "en"
                            ? "Compose"
                            : "Composer"
                          : lang === "en"
                            ? "View"
                            : "Voir"}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {visibleCategories.length === 0 ? (
              <p className="rounded-2xl bg-surface px-4 py-10 text-center text-muted">
                {menu.introEnabled && mealChoice === "boire" && !query.trim() && !diet
                  ? lang === "en"
                    ? "Drinks menu coming soon."
                    : "Carte des boissons bientôt disponible."
                  : query.trim()
                    ? lang === "en"
                      ? "No dish found."
                      : "Aucun plat trouvé."
                    : t("noDishForDiet")}
              </p>
            ) : (
              visibleCategories.map((c) => (
                <section
                  key={c.id}
                  id={c.id}
                  ref={(el) => {
                    sectionRefs.current[c.id] = el;
                  }}
                  style={{ scrollMarginTop: navH + 8 }}
                >
                  {/* En-tête de catégorie épinglé — centré, serif, filet doré */}
                  <div
                    className="sticky z-10 -mx-4 mb-5 border-b border-brand/25 bg-bg/95 px-4 py-3 backdrop-blur"
                    style={{ top: navH }}
                  >
                    <h2 className="text-center">
                      <span className="font-display text-2xl font-semibold uppercase tracking-[0.14em] text-text">
                        {pick(lang, c.name, c.nameEn)}
                      </span>
                      <span className="ml-2 align-middle font-display text-base italic text-brand">
                        {c.dishes.length}
                      </span>
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    {c.dishes.map((d) => (
                      <DishCard
                        key={d.id}
                        dish={d}
                        currency={restaurant.currency}
                        canOrder={ordering}
                        hasVideo={features.video}
                        onOpen={() => setOpenDish(d)}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}
          </main>

          <footer className="mt-10 space-y-2 px-5 pb-4 text-center text-xs text-muted">
            <div>
              <FeedbackButton
                restaurantId={restaurant.id}
                tableNumber={tableNumber}
              />
            </div>
            <a href="/confidentialite" className="underline underline-offset-2">
              Confidentialité
            </a>{" "}
            · <a href="/mentions-legales" className="underline underline-offset-2">
              Mentions légales
            </a>
          </footer>
        </div>

        {openDish && (
          <DishSheet
            dish={openDish}
            currency={restaurant.currency}
            canOrder={ordering}
            hasVideo={features.video}
            onClose={() => setOpenDish(null)}
          />
        )}

        {openFormule && (
          <FormuleSheet
            formule={openFormule}
            currency={restaurant.currency}
            canOrder={ordering}
            onClose={() => setOpenFormule(null)}
          />
        )}

        {menu.introEnabled && mealChoice === null && (
          <IntroScreen
            restaurantName={restaurant.name}
            logoUrl={restaurant.logoUrl}
            lang={lang}
          />
        )}

        {/* Fenêtres pilotées depuis la page d'accès (déclencheurs masqués) */}
        {menu.loyalty.enabled && (
          <LoyaltyCard
            restaurantId={restaurant.id}
            hideTrigger
            open={loyaltyOpen}
            onOpenChange={setLoyaltyOpen}
          />
        )}
        <GiftWheel
          restaurantId={restaurant.id}
          gift={gift}
          hideTrigger
          open={wheelOpen}
          onOpenChange={setWheelOpen}
        />

        {/* Page « accès rapides » : logo au centre, 3 choix autour */}
        {hubOpen && (
          <ActionsHub
            logoUrl={restaurant.logoUrl}
            name={restaurant.name}
            lang={lang}
            restaurantId={restaurant.id}
            tableNumber={tableNumber}
            loyaltyEnabled={menu.loyalty.enabled}
            giftEnabled={gift.enabled}
            onClose={() => setHubOpen(false)}
            onLoyalty={() => {
              setHubOpen(false);
              setLoyaltyOpen(true);
            }}
            onWheel={() => {
              setHubOpen(false);
              setWheelOpen(true);
            }}
          />
        )}

        {/* Flèches monter / descendre */}
        <div className="fixed bottom-24 right-3 z-30 flex flex-col gap-2">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label={lang === "en" ? "Scroll up" : "Monter"}
            className="grid h-11 w-11 place-items-center rounded-full bg-surface/90 text-brand shadow-lg ring-1 ring-brand/30 backdrop-blur transition active:scale-90"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 15l6-6 6 6" />
            </svg>
          </button>
          <button
            onClick={() =>
              window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: "smooth",
              })
            }
            aria-label={lang === "en" ? "Scroll down" : "Descendre"}
            className="grid h-11 w-11 place-items-center rounded-full bg-surface/90 text-brand shadow-lg ring-1 ring-brand/30 backdrop-blur transition active:scale-90"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>

        {ordering && (
          <CartBar
            slug={restaurant.slug}
            restaurantId={restaurant.id}
            tableNumber={tableNumber}
            currency={restaurant.currency}
            tipEnabled={menu.tipEnabled}
          />
        )}

      </div>
    </CartProvider>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "border-brand bg-brand/15 text-brand"
          : "border-border bg-surface text-muted hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}
