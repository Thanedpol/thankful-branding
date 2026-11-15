import type { Series } from "@/lib/youtube";

/**
 * Answer-first section intros for the home page, built from live data (series
 * counts, article count, newest date) so the numbers in them stay true.
 * Each is one self-contained paragraph of roughly 40–80 words — the length
 * answer engines lift whole — in the three interface languages.
 */

export type Localized = { th: string; en: string; zh: string };

const DATE_LOCALE = { th: "th-TH", en: "en-GB", zh: "zh-CN" } as const;
const fmt = (iso: string, l: keyof Localized) =>
  new Date(iso).toLocaleDateString(DATE_LOCALE[l], {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  });

export function seriesPassage(series: Series[]): Localized {
  const total = series.length;
  const count = (g: Series["group"]) => series.filter((s) => s.group === g).length;
  const news = count("news");
  const learn = count("learn");
  const event = count("event");
  return {
    th: `ช่อง Thankful มี ${total} ซีรีส์ใน 3 กลุ่ม กลุ่มข่าว AI มี ${news} ซีรีส์ ตั้งแต่สรุปข่าวรายสัปดาห์ไปจนถึงหุ่นยนต์ กลุ่มเรียนรู้มี ${learn} ซีรีส์ ทั้งเจาะลึกโมเดลใหม่ รีวิวแอป AI และสอนใช้ Claude กับ ChatGPT ทีละขั้น และอีก ${event} ซีรีส์สรุปงานสัมมนากับงานแสดงเทคโนโลยี ตารางนี้เทียบทุกซีรีส์พร้อมตอนล่าสุด`,
    en: `The Thankful YouTube channel (@Thankful2026) splits its videos into ${total} series in 3 groups. ${news} news series run from the weekly AI roundup in AI ฉับไว News to robots and smart vehicles in Physical AI & Robotics News. ${learn} learning series explain new models, review AI apps and teach Claude and ChatGPT step by step, and ${event} series, Event to Grasp, sums up seminars and technology shows. This table compares all ${total} series with the latest episode of each and its date.`,
    zh: `YouTube 频道 Thankful（@Thankful2026）把视频分成 3 组、共 ${total} 个系列。${news} 个 AI 新闻系列，从每周汇总的 AI ฉับไว News，到讲机器人与智能汽车的 Physical AI & Robotics News；${learn} 个学习系列，讲解新模型、评测 AI 应用，并一步步教你使用 Claude 和 ChatGPT；另有 ${event} 个系列 Event to Grasp，整理研讨会和科技展的重点。下表对比全部 ${total} 个系列及各自最新一集和发布日期。`,
  };
}

export function blogPassage(total: number, shown: number, newest?: string | null): Localized {
  const th = newest ? ` บทความล่าสุดลงเมื่อ ${fmt(newest, "th")}` : "";
  const en = newest ? ` The newest was published on ${fmt(newest, "en")}.` : "";
  const zh = newest ? `最新一篇发布于 ${fmt(newest, "zh")}。` : "";
  return {
    th: `บล็อกนี้มีบทความ ${total} เรื่อง เล่าข่าว AI ธุรกิจ วิทยาศาสตร์และเทคโนโลยี ทั้งในไทยและต่างประเทศ หลายเรื่องสรุปจากงานสัมมนา งานแสดงเทคโนโลยี และประกาศของบริษัท ให้คนที่ไม่ได้ไปงานก็เข้าใจ ทุกบทความเขียนเป็นภาษาไทย${th} ด้านล่างคือ ${shown} เรื่องล่าสุด`,
    en: `This blog has ${total} articles on AI, business, science and technology news from Thailand and around the world. Many summarise and analyse seminars, technology shows and company announcements, so readers who were not there can see what happened and why it matters for business. Every article is written in Thai.${en} Below are the ${shown} newest; all ${total} are on the articles page.`,
    zh: `本博客共有 ${total} 篇文章，报道泰国及全球的 AI、商业、科学与科技新闻。许多文章整理并分析研讨会、科技展和企业公告，让没去现场的读者也能了解发生了什么、与商业有何关系。所有文章均以泰语撰写。${zh}下面是最新的 ${shown} 篇，全部 ${total} 篇可在文章页阅读。`,
  };
}
