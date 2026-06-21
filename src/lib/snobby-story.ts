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
  thumbnail: "/portfolio/snobby-story.svg",
  tagline: "นิทานสอนใจ ดีๆ ที่จะช่วยให้เด็กเติบโตไปอย่างมั่นคง",
  intro:
    "ใช้ AI สร้างการ์ตูนนิทานสอนใจสำหรับเด็ก — ปลูกฝังคุณธรรม ความเมตตา ความซื่อสัตย์ และความเห็นอกเห็นใจ ผ่านเรื่องเล่าที่สนุกและเข้าใจง่าย",
  tags: ["AI Cartoon", "Storytelling", "Kids", "YouTube"],
  /** Each item becomes a flashcard with its detail + a "watch on YouTube" button. */
  stories: [
    {
      detail:
        "Nurture your child's moral compass with heartwarming stories that teach valuable life lessons.",
      youtubeUrl: "",
    },
    {
      detail:
        "Join us on a journey of kindness, honesty, and compassion through engaging tales for young minds.",
      youtubeUrl: "",
    },
    {
      detail:
        "Instill a strong sense of ethics and empathy in your children with our collection of moral stories.",
      youtubeUrl: "",
    },
    {
      detail:
        "Let our enchanting tales guide your child's development into a responsible and caring individual.",
      youtubeUrl: "",
    },
    {
      detail:
        "Embark on an adventure of moral values with our captivating stories that inspire and educate.",
      youtubeUrl: "",
    },
  ] as SnobbyStoryItem[],
};
