import { savePressKit } from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/server";
import type { PressKit, LogoFile } from "@/lib/types";

export const revalidate = 0;

const field =
  "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-cyan/50";

export default async function AdminPressKitPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("press_kit").select("*").eq("id", 1).single();
  const k = data as PressKit | null;

  // Existing logo rows + 3 empty rows for new entries.
  const logos: LogoFile[] = [
    ...((k?.logo_files as LogoFile[]) ?? []),
    { label: "", file_url: "" },
    { label: "", file_url: "" },
    { label: "", file_url: "" },
  ];

  return (
    <div>
      <p className="eyebrow">// Media</p>
      <h1 className="mb-6 font-display text-3xl font-bold">Press Kit</h1>

      <form action={savePressKit} className="glass max-w-2xl space-y-4 p-6">
        <L l="Short bio">
          <textarea name="short_bio" rows={2} defaultValue={k?.short_bio ?? ""} className={`${field} resize-none`} />
        </L>
        <L l="Long bio">
          <textarea name="long_bio" rows={5} defaultValue={k?.long_bio ?? ""} className={`${field} resize-none`} />
        </L>
        <div className="grid grid-cols-2 gap-4">
          <L l="Headshot URL">
            <input name="headshot_url" defaultValue={k?.headshot_url ?? ""} className={field} />
          </L>
          <L l="Media contact email">
            <input name="media_contact_email" defaultValue={k?.media_contact_email ?? ""} className={field} />
          </L>
        </div>
        <L l="Downloadable kit — object path in 'press-assets' bucket (e.g. kit/press-kit.pdf)">
          <input name="downloadable_kit_pdf_url" defaultValue={k?.downloadable_kit_pdf_url ?? ""} className={field} />
        </L>
        <L l="Awards (comma separated)">
          <input name="awards" defaultValue={k?.awards?.join(", ") ?? ""} className={field} />
        </L>

        <p className="pt-2 font-mono text-[11px] uppercase tracking-wider text-cyan/70">
          Logo / asset files — label + object path in 'press-assets' bucket
        </p>
        <div className="space-y-2">
          {logos.map((logo, i) => (
            <div key={i} className="grid grid-cols-2 gap-3">
              <input name="logo_label" placeholder="Label" defaultValue={logo.label} className={field} />
              <input name="logo_url" placeholder="path/in/bucket.svg" defaultValue={logo.file_url} className={field} />
            </div>
          ))}
        </div>

        <button type="submit" className="btn-neon mt-2">
          Save press kit
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
