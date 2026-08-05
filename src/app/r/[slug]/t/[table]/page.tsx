import { notFound } from "next/navigation";
import { getMenu } from "@/lib/menu";
import { MenuApp } from "@/components/guest/MenuApp";

// La page du menu convive — l'URL du QR code :
//   menu.mondomaine/r/{slug}/t/{numéro de table}
export default async function MenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; table: string }>;
  searchParams: Promise<{ vue?: string }>;
}) {
  const { slug, table } = await params;
  const { vue } = await searchParams;
  const menu = await getMenu(slug);
  if (!menu) notFound();

  const parsed = parseInt(table, 10);
  const tableNumber = Number.isFinite(parsed) && parsed > 0 ? parsed : null;

  // Choix Boire/Manger lu dans l'URL (?vue=…) : l'écran d'accueil se ferme par
  // une vraie navigation, robuste même si le JS du navigateur ne s'exécute pas.
  const initialView =
    vue === "boire" ? "boire" : vue === "manger" ? "manger" : null;

  return (
    <MenuApp menu={menu} tableNumber={tableNumber} initialView={initialView} />
  );
}
