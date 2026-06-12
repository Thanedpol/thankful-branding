import { redirect } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import { getCurrentProfile } from "@/lib/supabase/server";

export const metadata = { title: "Admin — Thank Thanedpol" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense in depth — middleware already guards, but never trust one layer.
  const profile = await getCurrentProfile();
  if (!profile) redirect("/admin/login");
  if (profile.role !== "admin") redirect("/admin/login?error=not_admin");

  return (
    <div className="flex min-h-screen bg-space">
      <Sidebar email={profile.email} />
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-5xl px-8 py-10">{children}</div>
      </main>
    </div>
  );
}
