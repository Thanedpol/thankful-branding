import { toggleMessageRead, deleteMessage } from "@/app/admin/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ContactMessage } from "@/lib/types";

export const revalidate = 0;

export default async function AdminMessagesPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("contact_messages")
    .select("*")
    .order("received_at", { ascending: false });

  const messages = (data as ContactMessage[]) ?? [];
  const unread = messages.filter((m) => !m.is_read).length;

  return (
    <div>
      <p className="eyebrow">// Inbox</p>
      <h1 className="mb-1 font-display text-3xl font-bold">Messages</h1>
      <p className="mb-6 font-mono text-xs text-muted">
        {messages.length} total · {unread} unread
      </p>

      <div className="space-y-3">
        {messages.length === 0 ? (
          <p className="glass p-6 font-mono text-sm text-muted">No messages yet.</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`glass p-5 ${m.is_read ? "opacity-70" : "border-cyan/20"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-body font-medium">
                    {!m.is_read && <span className="mr-2 text-cyan">●</span>}
                    {m.sender_name}{" "}
                    <a
                      href={`mailto:${m.sender_email}`}
                      className="font-mono text-xs text-cyan hover:underline"
                    >
                      &lt;{m.sender_email}&gt;
                    </a>
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-muted">
                    {m.subject || "(no subject)"} ·{" "}
                    {new Date(m.received_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <form action={toggleMessageRead}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="is_read" value={String(!m.is_read)} />
                    <button className="font-mono text-xs uppercase tracking-wider text-cyan/70 hover:text-cyan">
                      {m.is_read ? "Mark unread" : "Mark read"}
                    </button>
                  </form>
                  <form action={deleteMessage}>
                    <input type="hidden" name="id" value={m.id} />
                    <button className="font-mono text-xs uppercase tracking-wider text-red-400/70 hover:text-red-400">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap border-t border-line/[0.06] pt-3 text-sm leading-relaxed text-muted">
                {m.body}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
