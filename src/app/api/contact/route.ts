import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendContactNotification } from "@/lib/email";
import { isSupabaseConfigured } from "@/lib/demo-data";

export async function POST(request: Request) {
  // Demo mode (no backend) — accept the submission but don't persist/email.
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, demo: true });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sender_name = String(payload.sender_name ?? "").trim();
  const sender_email = String(payload.sender_email ?? "").trim();
  const subject = String(payload.subject ?? "").trim();
  const body = String(payload.body ?? "").trim();

  if (!sender_name || !sender_email || !body) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sender_email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const admin = createAdminClient();

  // 1. Persist to the Messages table.
  const { error } = await admin.from("contact_messages").insert({
    sender_name,
    sender_email,
    subject: subject || null,
    body,
  });
  if (error) {
    console.error("[contact] insert failed", error);
    return NextResponse.json({ error: "Could not save message" }, { status: 500 });
  }

  // 2. Notify the admin by email (best-effort — never blocks the response).
  try {
    await sendContactNotification({ senderName: sender_name, senderEmail: sender_email, subject, body });
  } catch (e) {
    console.error("[contact] email notification failed", e);
  }

  return NextResponse.json({ ok: true });
}
