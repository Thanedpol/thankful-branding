import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface ContactNotification {
  senderName: string;
  senderEmail: string;
  subject: string;
  body: string;
}

/**
 * Emails the admin when a contact message arrives.
 * No-ops (logs a warning) if RESEND_API_KEY is unset so local dev still works.
 */
export async function sendContactNotification(msg: ContactNotification) {
  const to = process.env.CONTACT_NOTIFY_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL ?? "onboarding@resend.dev";

  if (!resend || !to) {
    console.warn(
      "[email] RESEND_API_KEY / CONTACT_NOTIFY_EMAIL not set — skipping email notification."
    );
    return;
  }

  await resend.emails.send({
    from,
    to,
    replyTo: msg.senderEmail,
    subject: `📡 New contact: ${msg.subject || "(no subject)"}`,
    html: `
      <div style="font-family:system-ui,sans-serif;background:#050508;color:#fff;padding:24px;border-radius:12px">
        <h2 style="color:#00F5FF;margin:0 0 16px">New contact message</h2>
        <p><strong style="color:#8892A4">From:</strong> ${escapeHtml(msg.senderName)} &lt;${escapeHtml(msg.senderEmail)}&gt;</p>
        <p><strong style="color:#8892A4">Subject:</strong> ${escapeHtml(msg.subject || "(none)")}</p>
        <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:16px 0" />
        <p style="white-space:pre-wrap;line-height:1.6">${escapeHtml(msg.body)}</p>
      </div>
    `,
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
