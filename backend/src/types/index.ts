// User types
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'author' | 'reader';
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  can_delete_own_comments?: boolean;
  can_delete_others_comments?: boolean;
}

export interface Profile {
  user_id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  social_links: Record<string, string>;
}

export interface UserWithProfile extends User {
  profiles: Profile | null;
}

// Content types
export interface Topic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_url: string | null;
  created_at: string;
}

export interface Publication {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  owner_id: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface Post {
  id: string;
  author_id: string | null;
  publication_id: string | null;
  title: string;
  subtitle: string | null;
  slug: string;
  content: ContentBlock[];
  cover_url: string | null;
  status: 'draft' | 'review' | 'published' | 'archived';
  published_at: string | null;
  is_staff_pick: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PostWithStats extends Post {
  clap_count: number;
  view_count: number;
  comment_count: number;
  reading_time: number;
  author?: UserWithProfile;
  topics?: Topic[];
  publication?: Publication;
  is_saved?: boolean;
}

// Content blocks (TipTap JSON format)
export interface ContentBlock {
  type: string;
  content?: ContentBlock[];
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
}

// Engagement types
export interface Clap {
  id: string;
  post_id: string;
  user_id: string | null;
  session_id: string | null;
  count: number;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string | null;
  parent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  author?: UserWithProfile;
  replies?: Comment[];
}

export interface Bookmark {
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface TopicFollow {
  user_id: string;
  topic_id: string;
  created_at: string;
}

export interface PostView {
  id: number;
  post_id: string;
  user_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  viewed_at: string;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
