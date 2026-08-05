import { requireSuperAdmin } from "@/lib/require-admin";
import { AdminHeader } from "@/components/admin/AdminHeader";

// Espace super-admin — réservé au rôle SUPERADMIN.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSuperAdmin();
  return (
    <div className="min-h-screen">
      <AdminHeader />
      <main className="mx-auto max-w-4xl px-4 py-5 md:px-6">{children}</main>
    </div>
  );
}
