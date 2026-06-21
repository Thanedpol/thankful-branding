import { redirect } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import { isAdminAuthed } from "@/lib/admin-auth";

export const metadata = { title: "Admin — Thank Thanedpol" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense in depth — middleware already guards, but re-check the passcode.
  if (!(await isAdminAuthed())) redirect("/admin/login");

  return (
    <div className="flex min-h-screen bg-space">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-5xl px-8 py-10">{children}</div>
      </main>
    </div>
  );
}
