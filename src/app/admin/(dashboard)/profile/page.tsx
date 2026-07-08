import { saveProfile } from "@/app/admin/actions";
import ImageUpload from "@/components/admin/ImageUpload";
import PublicFileUpload from "@/components/admin/PublicFileUpload";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured, demoProfile } from "@/lib/demo-data";
import type { SiteProfile } from "@/lib/types";

export const revalidate = 0;

const field =
  "w-full rounded-lg border border-line/10 bg-surface/[0.03] px-3 py-2 text-sm text-ink placeholder:text-ink/30 outline-none focus:border-cyan/50";

export default async function AdminProfilePage() {
  let p: SiteProfile | null = demoProfile;
  if (isSupabaseConfigured()) {
    const { data } = await createAdminClient()
      .from("site_profile")
      .select("*")
      .eq("id", 1)
      .single();
    p = data as SiteProfile | null;
  }

  return (
    <div>
      <p className="eyebrow">// Identity</p>
      <h1 className="mb-6 font-display text-3xl font-bold">Profile</h1>

      <form action={saveProfile} className="glass max-w-2xl space-y-4 p-6">
        <L l="Name">
          <input name="name" required defaultValue={p?.name} className={field} />
        </L>
        <L l="Headline">
          <input name="headline" defaultValue={p?.headline ?? ""} className={field} />
        </L>
        <L l="Long bio">
          <textarea name="long_bio" rows={5} defaultValue={p?.long_bio ?? ""} className={`${field} resize-none`} />
        </L>
        <ImageUpload
          name="avatar_url"
          defaultValue={p?.avatar_url ?? ""}
          bucket="avatars"
          label="Avatar"
        />
        <L l="Background reel URL">
          <input name="background_reel_url" defaultValue={p?.background_reel_url ?? ""} className={field} />
        </L>

        <p className="pt-2 font-mono text-[11px] uppercase tracking-wider text-cyan/70">
          CV / Resume — ปุ่ม “ดู CV” หน้าแรก
        </p>
        <PublicFileUpload
          name="cv_th_url"
          defaultValue={p?.cv_th_url ?? ""}
          label="CV (ภาษาไทย)"
          accept=".pdf,.html,.doc,.docx,image/*"
          hint="วางลิงก์ (PDF / เว็บ / Google Drive) หรืออัปโหลดไฟล์ · เว้นว่าง = ใช้ค่าเริ่มต้น /cv/cv-th.html"
        />
        <PublicFileUpload
          name="cv_en_url"
          defaultValue={p?.cv_en_url ?? ""}
          label="CV (English)"
          accept=".pdf,.html,.doc,.docx,image/*"
          hint="Paste a link or upload a file · blank = built-in /cv/cv-en.html"
        />

        <p className="pt-2 font-mono text-[11px] uppercase tracking-wider text-cyan/70">
          Social links
        </p>
        <div className="grid grid-cols-2 gap-4">
          <L l="TikTok"><input name="tiktok" defaultValue={p?.social_links?.tiktok ?? ""} placeholder="https://tiktok.com/@handle" className={field} /></L>
          <L l="Facebook"><input name="facebook" defaultValue={p?.social_links?.facebook ?? ""} placeholder="https://facebook.com/page" className={field} /></L>
          <L l="X"><input name="x" defaultValue={p?.social_links?.x ?? ""} className={field} /></L>
          <L l="LinkedIn"><input name="linkedin" defaultValue={p?.social_links?.linkedin ?? ""} className={field} /></L>
          <L l="GitHub"><input name="github" defaultValue={p?.social_links?.github ?? ""} className={field} /></L>
          <L l="Email"><input name="email" defaultValue={p?.social_links?.email ?? ""} className={field} /></L>
        </div>

        <button type="submit" className="btn-neon mt-2">
          Save profile
        </button>
      </form>
    </div>
  );
}

function L({ l, children }: { l: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-muted">{l}</span>
      {children}
    </label>
  );
}
