import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";

/*
 * Written from what the code actually does (2026-11-15):
 *   accounts      → Supabase Auth, email + password      (src/components/AuthForm.tsx)
 *   shop orders   → shop_orders: email, name, phone, note; payment on Stripe Checkout;
 *                   receipt and file sent by Resend      (src/app/api/shop/*)
 *   contact       → contact_messages: name, email, subject, message; Resend notification
 *   blog views    → blog_views: slug, referrer, country, SHA-256 of IP + UA + daily salt
 *   browser       → localStorage "theme" and "locale"; Supabase session cookies
 *   embeds        → YouTube thumbnails, TikTok players (their own policies)
 * Update this page when any of those change.
 */

const TITLE = "นโยบายความเป็นส่วนตัว";

export const metadata: Metadata = {
  title: `${TITLE} — Thank Thanedpol`,
  description: "ข้อมูลที่เว็บไซต์ Thank Thanedpol เก็บ ใช้ทำอะไร ส่งให้ใคร และวิธีขอดูหรือลบข้อมูลของคุณ",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage path="/privacy" title={TITLE} crumb="Privacy">
      <p>
        เว็บไซต์นี้ดูแลโดยคุณแต้ง ธเนศพล เดชาดวงสกุล (Thank Thanedpol) ติดต่อเรื่องข้อมูลส่วนบุคคลได้ที่{" "}
        <a href="mailto:thank.2643@gmail.com">thank.2643@gmail.com</a> หน้านี้อธิบายว่าเว็บไซต์เก็บข้อมูลอะไร
        ใช้ทำอะไร และคุณขอดู แก้ไข หรือลบข้อมูลได้อย่างไร ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
      </p>

      <h2>ข้อมูลที่เก็บ และเก็บเมื่อไร</h2>
      <ul>
        <li>
          <strong>อ่านบทความทั่วไป</strong> — ไม่ต้องสมัครสมาชิก เว็บไซต์นับยอดอ่านโดยเก็บชื่อบทความ เว็บที่คุณมาจาก
          ประเทศ และรหัสที่คำนวณจาก IP กับชนิดเบราว์เซอร์ผสมค่าที่เปลี่ยนทุกวัน รหัสนี้ใช้นับผู้อ่านไม่ซ้ำในแต่ละวัน
          ย้อนกลับเป็น IP ไม่ได้ และไม่ได้เก็บ IP ไว้
        </li>
        <li>
          <strong>สมัครสมาชิก</strong> — อีเมลและรหัสผ่าน (รหัสผ่านถูกเข้ารหัสโดยผู้ให้บริการระบบสมาชิก
          เจ้าของเว็บมองไม่เห็น) ใช้เพื่อเข้าสู่ระบบและเปิดเนื้อหาสำหรับสมาชิก
        </li>
        <li>
          <strong>สั่งซื้อสินค้าหรือบริการ</strong> — อีเมล (จำเป็น) ชื่อ เบอร์โทร และหมายเหตุ (ไม่บังคับ)
          รวมถึงรายการที่ซื้อและยอดเงิน ใช้เพื่อส่งใบเสร็จ ไฟล์ดาวน์โหลด และติดต่อเรื่องคำสั่งซื้อ
          ข้อมูลบัตรชำระเงินกรอกบนหน้าของ Stripe โดยตรง เว็บไซต์นี้ไม่ได้รับหรือเก็บเลขบัตร
        </li>
        <li>
          <strong>ส่งข้อความติดต่อ</strong> — ชื่อ อีเมล หัวข้อ และข้อความ ใช้เพื่อตอบกลับเท่านั้น
        </li>
        <li>
          <strong>การตั้งค่าในเบราว์เซอร์</strong> — ธีมสว่าง/มืด และภาษาที่เลือก เก็บไว้ในเบราว์เซอร์ของคุณเอง
          ส่วนสมาชิกที่เข้าสู่ระบบจะมีคุกกี้สำหรับจำการเข้าสู่ระบบ เว็บไซต์นี้ไม่ใช้คุกกี้โฆษณาหรือตัวติดตามจากภายนอก
        </li>
      </ul>

      <h2>ผู้ให้บริการที่ข้อมูลผ่าน</h2>
      <ul>
        <li>Vercel — โฮสต์เว็บไซต์</li>
        <li>Supabase — ฐานข้อมูลและระบบสมาชิก</li>
        <li>Stripe — รับชำระเงิน</li>
        <li>Resend — ส่งอีเมลใบเสร็จ ไฟล์ดาวน์โหลด และการแจ้งเตือนข้อความติดต่อ</li>
        <li>
          YouTube และ TikTok — ภาพหน้าปกและวิดีโอที่ฝังบนหน้าเว็บโหลดจากผู้ให้บริการเหล่านี้
          ซึ่งมีนโยบายความเป็นส่วนตัวของตัวเอง
        </li>
      </ul>
      <p>เว็บไซต์นี้ไม่ขายหรือให้เช่าข้อมูลส่วนบุคคลแก่ใคร</p>

      <h2>เก็บไว้นานแค่ไหน</h2>
      <p>
        เก็บเท่าที่จำเป็นต่อวัตถุประสงค์ข้างต้น เช่น ข้อมูลคำสั่งซื้อเก็บไว้เป็นหลักฐานการซื้อขาย ข้อมูลบัญชีสมาชิก
        เก็บจนกว่าคุณขอลบ
      </p>

      <h2>สิทธิของคุณ</h2>
      <p>
        คุณขอดูสำเนา ขอแก้ไข ขอลบ หรือคัดค้านการใช้ข้อมูลของคุณได้ โดยส่งอีเมลมาที่{" "}
        <a href="mailto:thank.2643@gmail.com">thank.2643@gmail.com</a> จากอีเมลที่ใช้กับเว็บไซต์
        หากเห็นว่าข้อมูลถูกใช้ไม่เหมาะสม คุณร้องเรียนต่อสำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคลได้
      </p>

      <h2>การเปลี่ยนแปลงนโยบาย</h2>
      <p>
        เมื่อเว็บไซต์เปลี่ยนวิธีเก็บหรือใช้ข้อมูล หน้านี้จะอัปเดตพร้อมวันที่ด้านบน ดูเงื่อนไขการใช้งานเว็บไซต์ได้ที่{" "}
        <Link href="/terms">ข้อกำหนดการใช้งาน</Link>
      </p>
    </LegalPage>
  );
}
