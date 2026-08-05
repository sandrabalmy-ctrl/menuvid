import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { OrderStatus } from "@/components/guest/OrderStatus";
import { GiftWheel } from "@/components/guest/GiftWheel";
import { LangProvider } from "@/components/guest/lang";
import { themeStyle } from "@/lib/themes";
import { giftConfigFrom } from "@/lib/gift";

// Écran de confirmation + suivi temps réel après l'envoi d'une commande.
export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ slug: string; orderId: string }>;
}) {
  const { slug, orderId } = await params;
  const resto = await db.restaurant.findUnique({ where: { slug } });
  if (!resto) notFound();

  return (
    <LangProvider>
      <div
        style={themeStyle(resto.theme, resto.brandColor)}
        className="min-h-screen"
      >
        <OrderStatus
          orderId={orderId}
          slug={slug}
          currency={resto.currency}
          onlinePaymentEnabled={resto.onlinePaymentEnabled}
        />
        <div className="mx-auto max-w-md px-5 pb-8">
          <GiftWheel restaurantId={resto.id} gift={giftConfigFrom(resto)} />
        </div>
      </div>
    </LangProvider>
  );
}
