export type UserRole = "member" | "admin";
export type PortfolioCategory = "Video" | "Web" | "Design" | "Other";
export type BlogStatus = "draft" | "published";

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
}

export interface Portfolio {
  id: string;
  thumbnail_url: string | null;
  title: string;
  description: string | null;
  tech_tags: string[];
  project_url: string | null;
  category: PortfolioCategory;
  featured: boolean;
  display_order: number;
  created_at: string;
}

/** AI translation of a post into one language. Body absent on previews. */
export interface BlogTranslation {
  title?: string;
  excerpt?: string;
  body?: string;
}

/** Per-locale translations map (source is Thai; en/zh are machine-translated). */
export interface BlogTranslations {
  en?: BlogTranslation;
  zh?: BlogTranslation;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  body: string | null;
  /** Members-only continuation, stored separately (RLS-protected). */
  member_body?: string | null;
  excerpt: string | null;
  cover_image_url: string | null;
  tags: string[];
  is_public: boolean;
  /** World-readable flag: a members-only section exists for this post. */
  has_member_content?: boolean;
  status: BlogStatus;
  published_at: string | null;
  created_at: string;
  /** Denormalized all-time view total (kept in sync by a DB trigger). */
  view_count?: number;
  /** AI translations (title/excerpt/body) keyed by locale. */
  translations?: BlogTranslations;
}

/** Subset returned by the public `blog_previews` view (no body/member_body). */
export type BlogPreview = Omit<BlogPost, "body" | "member_body" | "status">;

// ─── Blog analytics (self-built view tracking) ───────────────────────────────

/** Headline counters returned by the `blog_view_totals()` RPC. */
export interface BlogViewTotals {
  total: number;
  today: number;
  last7: number;
  last30: number;
  unique30: number;
}

/** One point in the daily views series (`blog_views_daily`). */
export interface DailyViews {
  day: string; // ISO date (YYYY-MM-DD)
  views: number;
}

/** One bucket in a ranged, granularity-aware series (`blog_views_series`). */
export interface SeriesPoint {
  bucket_start: string; // ISO timestamp of the bucket's start
  views: number;
}

/** Time-bucket granularity for the analytics chart. */
export type Bucket = "hour" | "day" | "week" | "month";

/** Total + unique visitors inside a selected range (`blog_range_totals`). */
export interface RangeTotals {
  total: number;
  unique_visitors: number;
}

/** A row of the top-posts table (`blog_top_posts`). */
export interface TopPost {
  post_id: string;
  title: string;
  slug: string;
  views: number; // within the selected window
  total: number; // all-time
}

/** A labelled bucket in a dimension breakdown (referrer / country). */
export interface DimensionCount {
  label: string;
  views: number;
}

export interface SocialLinks {
  github: string;
  linkedin: string;
  x: string;
  tiktok: string;
  facebook: string;
  email: string;
}

export interface SiteProfile {
  id: number;
  name: string;
  headline: string | null;
  long_bio: string | null;
  avatar_url: string | null;
  background_reel_url: string | null;
  social_links: SocialLinks;
  /** "View CV" targets — blank falls back to the built-in /cv/*.html pages. */
  cv_th_url?: string | null;
  cv_en_url?: string | null;
}

/** Social metrics for a collection event (e.g. a Facebook post's numbers).
 *  All optional — old events simply omit them. */
export interface CollectionEventMetrics {
  reactions?: number;
  comments?: number;
  shares?: number;
  reach?: number;
  views?: number;
  /** ISO or display date the post was published. */
  date?: string;
}

/** An editable portfolio case-study page (Snobby Story, Insightist). Header
 *  fields plus shape-specific items in `data`. */
export interface PortfolioCollection {
  slug: string;
  title: string;
  tagline: string | null;
  intro: string | null;
  category: string | null;
  tags: string[];
  data: {
    stories?: { title?: string; detail: string; youtubeUrl: string }[];
    groups?: {
      name: string;
      popular?: boolean;
      events: {
        title: string;
        url: string;
        image?: string;
        /** Legacy single body — superseded by `sessions` (kept for old rows). */
        body?: string;
        slug?: string;
        /** Social metrics (reactions/comments/shares/…) shown on the card. */
        metrics?: CollectionEventMetrics;
        /** Admin-only marker: this body was stripped for the editor and must be
         *  restored from the stored row on save. Never persisted. */
        _stripped?: boolean;
        /** Sub-sessions (sub-blogs) shown as a carousel on the event's page. */
        sessions?: {
          title?: string;
          image?: string;
          body?: string;
          url?: string;
          /** Social metrics for this session (e.g. its own Facebook post). */
          metrics?: CollectionEventMetrics;
          /** Admin-only marker: body stripped for the editor, restored on save.
           *  Never persisted. */
          _stripped?: boolean;
        }[];
      }[];
    }[];
  };
}

export interface LogoFile {
  label: string;
  file_url: string;
}

export interface PressKit {
  id: number;
  short_bio: string | null;
  long_bio: string | null;
  headshot_url: string | null;
  logo_files: LogoFile[];
  awards: string[];
  media_contact_email: string | null;
  downloadable_kit_pdf_url: string | null;
}

export interface ContactMessage {
  id: string;
  sender_name: string;
  sender_email: string;
  subject: string | null;
  body: string;
  received_at: string;
  is_read: boolean;
}
