import Link from "next/link";
import { requireOwner } from "@/lib/require-owner";
import { ThemePicker } from "@/components/dashboard/ThemePicker";
import { WelcomeEditor } from "@/components/dashboard/WelcomeEditor";
import { TipToggle } from "@/components/dashboard/TipToggle";
import { PaymentToggle } from "@/components/dashboard/PaymentToggle";
import { LanguageSettings } from "@/components/dashboard/LanguageSettings";
import { LoyaltySettings } from "@/components/dashboard/LoyaltySettings";

export default async function AppearancePage() {
  const { restaurant } = await requireOwner();

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Apparence du menu</h1>
        <p className="text-sm text-muted">
          Personnalisez ce que verront vos clients quand ils scannent le QR code.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Message d’accueil</h2>
        <p className="text-sm text-muted">
          Un petit mot affiché en haut du menu pour accueillir vos clients.
        </p>
        <WelcomeEditor
          restaurantName={restaurant.name}
          current={restaurant.welcomeMessage}
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Fond du menu</h2>
        <ThemePicker
          currentTheme={restaurant.theme}
          brandColor={restaurant.brandColor}
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold">Commande</h2>
        <TipToggle enabled={restaurant.tipEnabled} />
        <PaymentToggle enabled={restaurant.onlinePaymentEnabled} />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Langues 🌍</h2>
        <LanguageSettings
          offerEnglish={restaurant.offerEnglish}
          welcomeMessageEn={restaurant.welcomeMessageEn}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Fidélité 🎟️</h2>
          <Link
            href="/dashboard/fidelite"
            className="text-sm text-brand"
          >
            Voir les membres →
          </Link>
        </div>
        <LoyaltySettings
          enabled={restaurant.loyaltyEnabled}
          threshold={restaurant.loyaltyThreshold}
          reward={restaurant.loyaltyReward}
        />
      </section>

      <Link
        href={`/r/${restaurant.slug}/t/1`}
        target="_blank"
        className="inline-block text-sm text-brand"
      >
        Voir mon menu tel que le voient les clients ↗
      </Link>
    </div>
  );
}
