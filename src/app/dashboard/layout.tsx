import { requireStaff } from "@/lib/require-owner";
import { DashboardNav } from "@/components/dashboard/DashboardNav";

// Mise en page de l'espace restaurateur — accessible au propriétaire et à la salle.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, restaurant } = await requireStaff();

  return (
    <div className="min-h-screen">
      <DashboardNav
        restaurantName={restaurant.name}
        plan={restaurant.plan}
        role={session.role}
      />
      {/* pb-24 pour laisser la place à la barre d'onglets mobile en bas */}
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-4 md:px-6 md:pb-8">
        {children}
      </main>
    </div>
  );
}
