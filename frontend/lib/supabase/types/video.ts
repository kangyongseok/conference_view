export interface Video {
  id: number;
  youtube_id: string;
  thumbnail_url: string | null;
  title: string;
  conference_name: string | null;
  published_at: string | null;
  description: string | null;
  video_url: string | null;
  programming_languages: string[] | null;
  job_type: string | null;
  year: number | null;
  speaker_name: string | null;
  speaker_org: string | null;
  duration: number | null;
  view_count: number | null;
  like_count: number | null;
  channel_name: string | null;
  tags: string[] | null;
}

export interface FilterOptions {
  year?: string[];
  conference?: string[];
  programmingLanguage?: string[];
  jobType?: string[];
  sortBy?: 'newest' | 'oldest' | 'title';
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

