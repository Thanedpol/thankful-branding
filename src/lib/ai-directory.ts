/**
 * "คลัง AI" (/ai-tools): AI websites by Thai makers and from abroad.
 *
 * Every entry was opened and its maker checked on AI_CHECKED (Thai entries
 * against the site's own text or a news source; sites that block automated
 * requests answered but could not be read). Descriptions are written from
 * what each site says about itself. To add one: append a line, make sure the
 * link opens and you know who made it, and update AI_CHECKED.
 */
export const AI_CHECKED = "2026-11-27";

export type AiOrigin = "th" | "intl";

export const AI_CATEGORIES = [
  { id: "apps", label: "แอปใหม่ฝีมือคนไทย" },
  { id: "chat", label: "คุยถาม-ตอบ" },
  { id: "image", label: "สร้างภาพ / ดีไซน์" },
  { id: "video", label: "ทำวิดีโอ" },
  { id: "voice", label: "เสียง / เพลง" },
  { id: "code", label: "เขียนโค้ด / ทำแอป" },
  { id: "work", label: "งานออฟฟิศ" },
  { id: "research", label: "ค้นคว้า / แปลภาษา" },
  { id: "business", label: "ธุรกิจ / บริการลูกค้า" },
  { id: "pro", label: "กฎหมาย / การแพทย์" },
  { id: "dev", label: "โมเดล / API" },
] as const;

export type AiCategory = (typeof AI_CATEGORIES)[number]["id"];

export interface AiTool {
  name: string;
  url: string;
  maker: string;
  origin: AiOrigin;
  /** First one is the main category (shown on the card). */
  cats: AiCategory[];
  desc: string;
  /** Extra words people might type, Thai or English. */
  keys?: string;
}

const th = (name: string, url: string, maker: string, cats: AiCategory[], desc: string, keys?: string): AiTool => ({
  name, url, maker, origin: "th", cats, desc, keys,
});
const intl = (name: string, url: string, maker: string, cats: AiCategory[], desc: string, keys?: string): AiTool => ({
  name, url, maker, origin: "intl", cats, desc, keys,
});

export const AI_TOOLS: AiTool[] = [
  // ── ฝีมือคนไทย ──────────────────────────────────────────────────────────
  th("Typhoon", "https://opentyphoon.ai", "SCB 10X", ["dev", "chat"],
    "โมเดลและเครื่องมือภาษาไทยแบบเปิด ทั้งแชต เสียง และอ่านเอกสาร", "llm โมเดลภาษาไทย ocr ถอดเสียง"),
  th("ThaiLLM", "https://thaillm.or.th", "BDI, NECTEC, VISTEC และพันธมิตร", ["dev", "chat"],
    "โครงการโมเดลภาษาไทยของรัฐและเอกชน มี Playground และ API ให้ลอง", "llm sovereign โมเดลไทย api"),
  th("OpenThai", "https://openthai.ai", "ทีมพัฒนา OpenThaiGPT", ["dev"],
    "โมเดลภาษาไทยแบบเปิด ดาวน์โหลดไปรันบนเครื่องตัวเองได้", "openthaigpt llm โอเพนซอร์ส"),
  th("AI for Thai", "https://aiforthai.in.th", "NECTEC", ["dev"],
    "API ด้านภาษา ภาพ และบทสนทนาที่ทำมาเพื่อภาษาไทย", "nlp ocr แชตบอต เสียง api ภาครัฐ"),
  th("AIResearch.in.th", "https://airesearch.in.th", "VISTEC และ depa", ["dev", "research"],
    "สถาบันวิจัย AI ไทย เผยแพร่โมเดลและชุดข้อมูลภาษาไทย", "wangchan dataset งานวิจัย"),
  th("iApp", "https://iapp.co.th", "iApp Technology", ["dev", "voice", "business"],
    "API ภาษาไทย ทั้ง OCR, eKYC, แปลงเสียงเป็นข้อความ และ LLM", "ocr อ่านบัตร ยืนยันตัวตน tts stt chinda"),
  th("Botnoi Voice", "https://voice.botnoi.ai", "Botnoi Group", ["voice"],
    "แปลงข้อความเป็นเสียงพูดภาษาไทย ใช้ทำคลิปและสื่อ", "tts พากย์เสียง อ่านออกเสียง ฟรี"),
  th("BOTNOI", "https://botnoigroup.com", "Botnoi Group", ["business"],
    "แชตบอต วอยซ์บอต และ AI Agent สำหรับธุรกิจไทย", "chatbot voicebot ตอบลูกค้า"),
  th("ZWIZ.AI", "https://zwiz.ai", "ZWIZ.AI", ["business"],
    "แชตบอตและรวมแชตร้านค้าบน Facebook, LINE OA, TikTok และช่องทางอื่น", "ขายของออนไลน์ ตอบแชท บรอดแคสต์"),
  th("Gowajee", "https://www.gowajee.ai", "Gowajee", ["voice", "business"],
    "AI ที่โทรและรับสายเป็นภาษาไทยสำหรับองค์กร", "call center ถอดเสียง speech voice agent"),
  th("VISAI", "https://visai.ai", "VISAI (ต่อยอดจาก VISTEC)", ["business", "dev"],
    "โซลูชันและโมเดล AI สำหรับธุรกิจ ต่อกับระบบเดิมได้", "enterprise โซลูชัน"),
  th("AIGEN", "https://aigencorp.com", "AIGEN", ["business", "work"],
    "OCR อ่านเอกสาร จดจำใบหน้า และแชตบอตสำหรับองค์กร", "อ่านใบเสร็จ face recognition"),
  th("Amity Solutions", "https://www.amitysolutions.com", "Amity Group", ["business"],
    "AI Agent สำหรับคอลเซ็นเตอร์ ฝ่ายขาย และงานพนักงาน", "enterprise agent hr ขาย บริการลูกค้า"),
  th("Sertis", "https://www.sertiscorp.com", "Sertis", ["business"],
    "โซลูชัน AI และ Big Data สำหรับหลายอุตสาหกรรม", "ที่ปรึกษา data โซลูชัน"),
  th("EXZY AI", "https://exzy.ai", "EXZY", ["business"],
    "ออกแบบและเชื่อมต่อ AI ให้องค์กรจากโจทย์ธุรกิจจริง", "enterprise โซลูชัน ที่ปรึกษา"),
  th("Data Wow", "https://www.datawow.io", "Data Wow", ["business"],
    "ที่ปรึกษาด้านข้อมูลและพัฒนา AI ในกรุงเทพฯ", "data science บิ๊กดาต้า"),
  th("Wisesight", "https://wisesight.com", "Wisesight (Thailand)", ["business", "research"],
    "ฟังเสียงโซเชียลและวิเคราะห์ข้อมูลให้แบรนด์", "social listening การตลาด วิเคราะห์โซเชียล"),
  th("TRCLOUD", "https://www.trcloud.co", "TRCLOUD", ["work", "business"],
    "โปรแกรมบัญชีและ ERP บนคลาวด์ ให้ AI ช่วยบันทึกบัญชีและอ่านใบเสร็จ", "บัญชี ภาษี ใบกำกับภาษี erp"),
  th("UCanLaw", "https://www.ucanlaw.com", "UCanLaw", ["pro"],
    "ปรึกษากฎหมายเบื้องต้นด้วย AI และค้นหาทนายความ", "ทนาย คดี กฎหมาย"),
  th("CARIVA", "https://www.cariva.co.th", "CARIVA", ["pro", "voice"],
    "AI สรุปเวชระเบียนจากบทสนทนาแพทย์กับผู้ป่วย", "หมอ โรงพยาบาล medical scribe ถอดเสียง"),
  th("Perceptra", "https://perceptra.tech", "Perceptra", ["pro"],
    "AI ช่วยแพทย์อ่านภาพเอกซเรย์ปอดและแมมโมแกรม", "xray หมอ รังสี medical"),

  th("PyThaiNLP", "https://github.com/PyThaiNLP/pythainlp", "ชุมชน PyThaiNLP", ["dev"],
    "ไลบรารี Python สำหรับประมวลผลภาษาไทย เปิดซอร์สบน GitHub", "ตัดคำ nlp github โอเพนซอร์ส"),

  // ── แอปใหม่ฝีมือคนไทย ───────────────────────────────────────────────────
  // Public posts in the Claude Thailand Community group, plus apps suggested
  // to the site owner. No poster's name is published. Not every one of these
  // uses AI inside the product.
  th("ThaiPDF", "https://thaipdf.app", "แชร์ในกลุ่ม Claude Thailand Community", ["apps", "work"],
    "อ่านข้อความจาก PDF ที่สแกนมา ได้ไฟล์ที่ค้นหาและคัดลอกได้", "ocr แปลงไฟล์ เอกสารสแกน word"),
  th("50 ทวิ ออนไลน์", "https://tawi50.vercel.app", "แชร์ในกลุ่ม Claude Thailand Community", ["apps", "work"],
    "กรอกแล้วพิมพ์หนังสือรับรองหัก ณ ที่จ่าย (50 ทวิ) ได้ฟรี ไม่ต้องสมัคร", "ภาษี บัญชี หักณที่จ่าย tawi50"),
  th("กะไหน", "https://kanai-2026.vercel.app", "แชร์ในกลุ่ม Claude Thailand Community", ["apps", "work"],
    "ตารางกะของคนทำงานเป็นกะ ดูวันเข้ากะ วันหยุด และแจ้งเตือน", "ตารางเวร โรงงาน พยาบาล kanai"),
  th("Thoth", "https://thothnotes.com", "แชร์ในกลุ่ม Claude Thailand Community", ["apps", "work"],
    "แอปจดโน้ตโอเพนซอร์ส เก็บเป็นไฟล์ Markdown ในเครื่อง แชร์ได้เมื่อต้องการ", "จดบันทึก note obsidian notion"),
  th("Journex", "https://journexapp.com", "แชร์ในกลุ่ม Claude Thailand Community", ["apps", "business"],
    "บันทึกเทรด MT5 อัตโนมัติ แล้วสรุปให้เป็นภาษาคน", "trading journal เทรด forex"),
  th("OtterEng", "https://ottereng.online", "แชร์ในกลุ่ม Claude Thailand Community", ["apps"],
    "ซ้อมสอบ TOEIC ฟรี จับเวลาจริง มีเฉลยภาษาไทย", "ภาษาอังกฤษ เรียน สอบ mock toeic"),
  th("AI GAME TH", "https://aigameth.com", "AI GAME TH", ["apps", "code"],
    "รวมเกมบนเว็บที่สร้างด้วย AI จากคนไทย เล่นและแชร์เกมได้", "เกม game aigameth"),
  th("เกมดีดลูกแก้ว 3D", "https://mini-gameball.github.io/-/", "แชร์ในกลุ่ม Claude Thailand Community", ["apps"],
    "การละเล่นดีดลูกแก้วลานดินไทยแบบ 3 มิติ เล่นกับเพื่อนได้", "เกม game ของเล่นไทย"),
  th("Plants", "https://www.plants.work", "Plants", ["apps", "business"],
    "แพลตฟอร์มเติบโตในอาชีพ หางาน คอร์ส และเมนทอร์ มี AI ให้คำปรึกษา", "สมัครงาน career หางาน"),
  th("BuyMeChocolate.ai", "https://www.buymechocolate.ai", "BuyMeChocolate", ["apps", "chat"],
    "นิยายแชทกับตัวละคร AI ที่จำบทสนทนาได้ บางเรื่องมีเนื้อหาสำหรับผู้ใหญ่", "นิยาย roleplay แชทตัวละคร"),

  // ── ต่างประเทศ ──────────────────────────────────────────────────────────
  intl("ChatGPT", "https://chatgpt.com", "OpenAI", ["chat", "work", "code"],
    "ผู้ช่วย AI ถามตอบ เขียน สรุป และทำงานได้หลายอย่าง", "แชท gpt เขียนบทความ"),
  intl("Claude", "https://claude.ai", "Anthropic", ["chat", "code", "work"],
    "ผู้ช่วย AI สำหรับเขียน วิเคราะห์เอกสาร และเขียนโค้ด", "แชท สรุปเอกสาร"),
  intl("Gemini", "https://gemini.google.com", "Google", ["chat", "work"],
    "ผู้ช่วย AI ของ Google ใช้ร่วมกับบริการ Google ได้", "แชท bard"),
  intl("Microsoft Copilot", "https://copilot.com", "Microsoft", ["chat", "work"],
    "ผู้ช่วย AI ของ Microsoft", "แชท office windows"),
  intl("Perplexity", "https://www.perplexity.ai", "Perplexity AI", ["research", "chat"],
    "ถามแล้วได้คำตอบพร้อมแหล่งอ้างอิง", "ค้นหา search อ้างอิง"),
  intl("DeepSeek", "https://chat.deepseek.com", "DeepSeek", ["chat", "code"],
    "แชต AI จากจีน ใช้ถามตอบและเขียนโค้ด", "แชท"),
  intl("Qwen Chat", "https://chat.qwen.ai", "Alibaba", ["chat"],
    "แชตด้วยโมเดล Qwen ของ Alibaba", "แชท จีน"),
  intl("Grok", "https://grok.com", "xAI", ["chat"],
    "ผู้ช่วย AI ของ xAI", "แชท x twitter"),
  intl("Le Chat", "https://chat.mistral.ai", "Mistral AI", ["chat"],
    "ผู้ช่วย AI จากฝรั่งเศส", "แชท mistral ยุโรป"),
  intl("Meta AI", "https://www.meta.ai", "Meta", ["chat", "image"],
    "ผู้ช่วย AI ของ Meta", "แชท llama facebook"),
  intl("Midjourney", "https://www.midjourney.com", "Midjourney", ["image"],
    "สร้างภาพจากคำบรรยาย เน้นความสวยงาม", "วาดรูป อาร์ต"),
  intl("Ideogram", "https://ideogram.ai", "Ideogram", ["image"],
    "สร้างและแก้ภาพ เด่นเรื่องตัวหนังสือในภาพ", "โปสเตอร์ โลโก้ วาดรูป"),
  intl("Adobe Firefly", "https://firefly.adobe.com", "Adobe", ["image", "video"],
    "สตูดิโอสร้างภาพและสื่อด้วย AI ของ Adobe", "photoshop แต่งภาพ"),
  intl("Canva", "https://www.canva.com", "Canva", ["image", "work", "video"],
    "ออกแบบโพสต์ สไลด์ และคลิป มี AI ช่วย", "ดีไซน์ พรีเซนต์ โปสเตอร์"),
  intl("Leonardo.Ai", "https://leonardo.ai", "Canva", ["image"],
    "สร้างภาพและงานกราฟิกด้วย AI", "วาดรูป เกม"),
  intl("Krea", "https://www.krea.ai", "Krea", ["image", "video"],
    "สร้างและปรับภาพแบบเห็นผลสด", "อัปสเกล ขยายภาพ"),
  intl("Runway", "https://runway.com", "Runway", ["video"],
    "สร้างและตัดต่อวิดีโอด้วย AI", "หนัง คลิป"),
  intl("Kling AI", "https://kling.ai", "Kuaishou", ["video", "image"],
    "สร้างวิดีโอและภาพจากข้อความหรือรูป", "คลิป"),
  intl("Pika", "https://pika.art", "Pika", ["video"],
    "สร้างคลิปสั้นจากข้อความหรือรูป", "เอฟเฟกต์"),
  intl("HeyGen", "https://www.heygen.com", "HeyGen", ["video"],
    "ทำวิดีโอมีพิธีกร AI พูดแทน", "avatar พากย์ แปลคลิป"),
  intl("Synthesia", "https://www.synthesia.io", "Synthesia", ["video"],
    "ทำวิดีโออบรมและนำเสนอด้วยพิธีกร AI", "avatar เทรนนิ่ง"),
  intl("Higgsfield", "https://higgsfield.ai", "Higgsfield", ["video", "image"],
    "ชุดเครื่องมือสร้างคลิปและคอนเทนต์", "โฆษณา คลิปสั้น"),
  intl("ElevenLabs", "https://elevenlabs.io", "ElevenLabs", ["voice"],
    "สร้างเสียงพูดจากข้อความและทำ Voice Agent", "tts พากย์ โคลนเสียง"),
  intl("Suno", "https://suno.com", "Suno", ["voice"],
    "แต่งเพลงพร้อมเสียงร้องจากคำบรรยาย", "ดนตรี เพลง"),
  intl("Udio", "https://www.udio.com", "Udio", ["voice"],
    "สร้างเพลงด้วย AI", "ดนตรี เพลง"),
  intl("Cursor", "https://cursor.com", "Anysphere", ["code"],
    "โปรแกรมเขียนโค้ดที่มี AI Agent ช่วย", "ide โปรแกรมเมอร์"),
  intl("GitHub Copilot", "https://github.com/features/copilot", "GitHub", ["code"],
    "AI ช่วยเขียนโค้ดใน IDE และบน GitHub", "โปรแกรมเมอร์"),
  intl("Replit", "https://replit.com", "Replit", ["code"],
    "สร้างและรันแอปบนเบราว์เซอร์ด้วย AI", "ทำเว็บ ทำแอป"),
  intl("Lovable", "https://lovable.dev", "Lovable", ["code"],
    "พิมพ์บอกแล้วได้เว็บแอป", "ทำเว็บ ไม่ต้องเขียนโค้ด"),
  intl("v0", "https://v0.app", "Vercel", ["code"],
    "สร้างเว็บแอปและหน้าจอจากคำสั่ง", "ทำเว็บ ui"),
  intl("Bolt", "https://bolt.new", "StackBlitz", ["code"],
    "สร้างเว็บ แอป และต้นแบบจากคำสั่ง", "ทำเว็บ prototype"),
  intl("Gemini Notebook (NotebookLM)", "https://notebook.google", "Google", ["research", "work"],
    "อัปโหลดเอกสารแล้วถาม สรุป และทำความเข้าใจ", "notebooklm สรุปไฟล์ podcast"),
  intl("Gamma", "https://gamma.app", "Gamma", ["work"],
    "ทำสไลด์และเอกสารนำเสนอจากหัวข้อ", "พรีเซนต์ powerpoint"),
  intl("Notion AI", "https://www.notion.com/product/ai", "Notion", ["work"],
    "AI ในพื้นที่ทำงานรวมโน้ตและเอกสาร", "จดบันทึก จัดการงาน"),
  intl("Otter", "https://otter.ai", "Otter.ai", ["work", "voice"],
    "ถอดเสียงและสรุปการประชุม", "จดประชุม ถอดความ"),
  intl("DeepL", "https://www.deepl.com", "DeepL", ["research"],
    "แปลภาษาและแปลเสียง", "translate แปลเอกสาร"),
  intl("Consensus", "https://consensus.app", "Consensus", ["research"],
    "ค้นคำตอบจากงานวิจัย", "paper วิทยานิพนธ์"),
  intl("Elicit", "https://elicit.com", "Elicit", ["research"],
    "ช่วยค้นและสรุปงานวิจัย", "paper วิทยานิพนธ์"),
  intl("Hugging Face", "https://huggingface.co", "Hugging Face", ["dev"],
    "ชุมชนแชร์โมเดล ชุดข้อมูล และเดโม AI", "โมเดล โอเพนซอร์ส dataset"),
];

/**
 * Places to meet people and find work by others — kept apart from the tool
 * list because they are communities and collections, not AI products.
 */
export interface AiCommunity {
  name: string;
  desc: string;
  links: { label: string; url: string }[];
}

export const AI_COMMUNITIES: AiCommunity[] = [
  {
    name: "Claude Thailand Community",
    desc: "ชุมชนอาสาสมัครของผู้ใช้ Claude ในไทย มีข่าว บทความ กิจกรรม และตัวอย่างการใช้งาน กลุ่ม Facebook เป็นกลุ่มสาธารณะที่สมาชิกแชร์ผลงาน",
    links: [
      { label: "เว็บไซต์", url: "https://cthcommunity.com" },
      { label: "กลุ่ม Facebook", url: "https://www.facebook.com/groups/1745892855948687" },
      { label: "YouTube", url: "https://www.youtube.com/@ClaudeThailandCommunity" },
    ],
  },
  {
    name: "OpenAI Codex Community",
    desc: "กิจกรรมของคนใช้ Codex มีปฏิทินกลางของ OpenAI และ Meetup ที่จัดโดยชุมชนในเชียงใหม่",
    links: [
      { label: "ปฏิทินกิจกรรม", url: "https://luma.com/codex-community" },
      { label: "Meetup เชียงใหม่", url: "https://proflead.dev/codex/" },
    ],
  },
  {
    name: "โปรเจกต์ภาษาไทยบน GitHub",
    desc: "แหล่งรวมโค้ด โมเดล และชุดข้อมูลภาษาไทยที่เปิดซอร์ส",
    links: [
      { label: "หัวข้อ thai-nlp", url: "https://github.com/topics/thai-nlp" },
      { label: "หัวข้อ thai-llm", url: "https://github.com/topics/thai-llm" },
      { label: "awesome-thai-dev", url: "https://github.com/unnawut/awesome-thai-dev" },
      { label: "NLP Thai resources", url: "https://github.com/kobkrit/nlp_thai_resources" },
    ],
  },
];
