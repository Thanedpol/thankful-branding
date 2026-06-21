import { redirect } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import { isAdminAuthed } from "@/lib/admin-auth";
import { isSupabaseConfigured } from "@/lib/demo-data";

export const metadata = { title: "Admin — Thank Thanedpol" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense in depth — middleware already guards, but re-check the passcode.
  if (!(await isAdminAuthed())) redirect("/admin/login");
  const dbReady = isSupabaseConfigured();

  return (
    <div className="flex min-h-screen bg-space">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-5xl px-8 py-10">
          {!dbReady && (
            <div className="mb-8 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 font-mono text-xs leading-relaxed text-amber-300">
              ⚠ ยังไม่ได้เชื่อมต่อ Supabase — การเพิ่ม/แก้/ลบ <b>จะไม่ถูกบันทึก</b> และรายการจะว่างเสมอ
              <br />
              ใส่ <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> และ{" "}
              <code>SUPABASE_SERVICE_ROLE_KEY</code> ใน <code>.env.local</code>{" "}
              (จาก Supabase → Settings → API) แล้ว restart <code>npm run dev</code> ก่อนใช้งาน
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
