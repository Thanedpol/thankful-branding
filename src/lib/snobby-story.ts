/**
 * "Snobby Story" — AI-generated cartoon moral tales for kids.
 * A portfolio collection: the homepage card links to /portfolio/snobby-story,
 * which lists each story below. Add the real YouTube URLs to `youtubeUrl`.
 */
export interface SnobbyStoryItem {
  /** Optional short title (shown above the detail). */
  title?: string;
  detail: string;
  /** Full YouTube watch URL, e.g. https://www.youtube.com/watch?v=XXXX */
  youtubeUrl: string;
}

export const snobbyStory = {
  slug: "snobby-story",
  title: "Snobby Story",
  category: "Video",
  thumbnail: "/portfolio/snobby-story.jpg",
  tagline: "นิทานสอนใจ ดีๆ ที่จะช่วยให้เด็กเติบโตไปอย่างมั่นคง",
  intro:
    "ใช้ AI สร้างการ์ตูนนิทานสอนใจสำหรับเด็ก — ปลูกฝังคุณธรรม ความเมตตา ความซื่อสัตย์ และความเห็นอกเห็นใจ ผ่านเรื่องเล่าที่สนุกและเข้าใจง่าย",
  tags: ["AI Cartoon", "Storytelling", "Kids", "YouTube"],
  /** Each item becomes a flashcard with its detail + a "watch on YouTube" button. */
  stories: [
    {
      title: "นิทานสอนใจ เมล็ดพืช 2 พี่น้อง (พากย์ไทย)",
      detail:
        "เรื่องราวของสองพี่น้องกับเมล็ดพืช — บทเรียนเรื่องความขยัน ความซื่อสัตย์ และผลของการกระทำ",
      youtubeUrl: "https://youtu.be/_dmKzAlLXBY",
    },
    {
      title: "นิทานสอนใจ เมล็ดพืช 2 พี่น้อง (Eng Sub)",
      detail:
        "The Two Brothers and the Seeds — a moral tale about diligence, honesty, and the consequences of our actions. (English subtitles)",
      youtubeUrl: "https://youtu.be/uHwrq2aC46s",
    },
  ] as SnobbyStoryItem[],
};
