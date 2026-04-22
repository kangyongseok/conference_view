export interface Bookmark {
  id: number;
  user_id: string;
  url: string;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  embed_html: string | null;
  tags: string[];
  category: string | null;
  created_at: string;
  updated_at: string;
}
