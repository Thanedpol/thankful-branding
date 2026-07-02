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
}

/** Subset returned by the public `blog_previews` view (no body/member_body). */
export type BlogPreview = Omit<BlogPost, "body" | "member_body" | "status">;

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
