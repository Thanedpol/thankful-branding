/**
 * "Insightist" — Thank's main role: Content Creator on the technology & AI news
 * desk of Insightist AI Transformation Thailand. A portfolio collection: the
 * homepage card links to /portfolio/insightist, which lists the 23 events he
 * covered on-site (2025–2026), grouped by theme, each with its Facebook post.
 */
export interface InsightistEvent {
  title: string;
  /** Facebook post URL. */
  url: string;
}

export interface InsightistGroup {
  name: string;
  events: InsightistEvent[];
  /** Highlighted group (e.g. most popular) — excluded from the on-site count. */
  popular?: boolean;
}

export const insightist = {
  slug: "insightist",
  title: "Insightist",
  category: "Other",
  thumbnail: "/portfolio/insightist.svg",
  tagline:
    "Content Creator — ทีมข่าวเทคโนโลยีและ AI ของ Insightist AI Transformation Thailand",
  intro:
    "ผลิตคอนเทนต์ข่าวเทคโนโลยีและ AI ครบวงจร ตั้งแต่ดึงข้อมูล สรุป ตั้ง Headline จนถึงเผยแพร่ และลงพื้นที่ทำข่าวงานสัมมนา/นิทรรศการชั้นนำของไทยกว่า 23 งาน (2025–2026)",
  tags: ["AI News", "Journalism", "On-site Reporting", "Facebook"],
  groups: [
    {
      name: "โพสต์ที่มีคนสนใจมากที่สุด",
      popular: true,
      events: [
        { title: "คู่มือการ Prompt GPT-5 ใช้ครั้งเดียว ให้ AI ฉลาด ตอบตรง 100% ทำงานครบวงจร", url: "https://www.facebook.com/share/p/1Cpr2trCrf/" },
        { title: "สรุปคลิป Youtube: Ex-Google Exec — How to Position Yourself Now Before the Next AI Phase (2026–2027) | Mo Gawdat × Silicon Valley Girl (Marina Mogilko)", url: "https://www.facebook.com/share/p/1JJKhreFcz/" },
      ],
    },
    {
      name: "AI & เทคโนโลยี",
      events: [
        { title: "AWS Summit Bangkok 2025", url: "https://www.facebook.com/share/p/18wiq3YRGV/" },
        { title: "Microsoft SMEs AI Skill Summit 2025", url: "https://www.facebook.com/share/p/1FEnWQQdtE/" },
        { title: "NVIDIA VST ECS x AI Ecosphere 2025", url: "https://www.facebook.com/share/p/18sZUreCR1/" },
        { title: "KBTG Techtopia 2025", url: "https://www.facebook.com/share/p/17oXV6mWNf/" },
        { title: "AI Pavilion (จัดร่วมกับ Bitkub Summit 2025)", url: "https://www.facebook.com/share/p/16PX6LGVKr/" },
        { title: "DCT Seminar 2025", url: "https://www.facebook.com/share/p/1J9WVUGRTF/" },
        { title: "งานเปิดตัว Siam Quantum Square", url: "https://web.facebook.com/share/p/1FzyEi2J2Q/" },
        { title: "Techsauce HealthSpan Festival 2026", url: "https://web.facebook.com/share/p/1Er4dQCt5A/" },
        { title: "FutureSkill Next 2026", url: "https://www.facebook.com/share/p/1DPpDyC9vV/" },
        { title: "AgentCon Bangkok (21 ก.พ. 2569)", url: "https://www.facebook.com/share/p/18tnub2zUL/" },
        { title: "AI Revolution Shift 2026 (กรุงเทพธุรกิจ, 31 มี.ค. 2569)", url: "https://www.facebook.com/share/p/1EMWs3TrLv/" },
        { title: "AgentCamp Bangkok — Global AI Community (16 พ.ค. 2569)", url: "https://www.facebook.com/share/p/195ejeRnFd/" },
        { title: "Be the Top 10% with Claude Code", url: "https://web.facebook.com/share/p/1DffEmrVBS/" },
      ],
    },
    {
      name: "การตลาด & สื่อ",
      events: [
        { title: "CTC2025 (5–6 ก.ค. 2568)", url: "https://www.facebook.com/share/p/192TcMK4Sn/" },
        { title: "Marketing Conference 2025", url: "https://www.facebook.com/share/p/1DmX3WTt27/" },
        { title: "The Secret Sauce Summit 2026", url: "https://www.facebook.com/share/p/18oeKFz6ZR/" },
        { title: "Future Trends Ahead Summit 2026 (10 ก.พ. 2569)", url: "https://www.facebook.com/share/p/1927AyC9te/" },
        { title: "BT Awards 2026 — Beartai ครั้งที่ 2 (13 มี.ค. 2569)", url: "https://www.facebook.com/share/p/1DsZ8vRf8G/" },
        { title: "Ctrl Shift Create 2026", url: "https://www.facebook.com/share/p/18piMff4xA/" },
        { title: "Marketing Oops Summit 2026 (11 มิ.ย. 2569)", url: "https://www.facebook.com/share/p/1JzpZYL8g2/" },
      ],
    },
    {
      name: "ธุรกิจ & เศรษฐกิจ",
      events: [
        { title: "Smart Delivery Expo 2026 & Thai Cargo Expo 2026 (28 ม.ค. 2569)", url: "https://www.facebook.com/share/p/1DM6EDhJqv/" },
      ],
    },
    {
      name: "HR & People",
      events: [
        { title: "People Performance Conference 2026 (1 เม.ย. 2569)", url: "https://www.facebook.com/share/p/18oBJAnhJy/" },
        { title: "Thailand HR Tech 2026 (16–17 มิ.ย. 2569)", url: "https://www.facebook.com/share/p/18jtw1aQdA/" },
      ],
    },
  ] as InsightistGroup[],
};
