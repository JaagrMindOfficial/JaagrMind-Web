const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// ============================================================
// TYPES
// ============================================================

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'author' | 'reader';
  created_at: string;
  profiles?: Profile;
  can_delete_own_comments?: boolean;
  can_delete_others_comments?: boolean;
}

export interface Profile {
  user_id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
  social_links: Record<string, string>;
}

export interface Topic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_url: string | null;
}

export interface Post {
  id: string;
  author_id: string | null;
  title: string;
  subtitle: string | null;
  slug: string;
  content: ContentBlock[];
  cover_url: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  clap_count: number;
  view_count: number;
  comment_count: number;
  reading_time: number;
  author?: User;
  topics?: Topic[];
}

export interface ContentBlock {
  type: string;
  content?: ContentBlock[];
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string | null;
  parent_id: string | null;
  content: string;
  created_at: string;
  author?: Profile;
  replies?: Comment[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================
// AUTH STORAGE
// ============================================================

let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
  }
}

export function getTokens() {
  if (typeof window !== 'undefined' && !accessToken) {
    accessToken = localStorage.getItem('accessToken');
    refreshToken = localStorage.getItem('refreshToken');
  }
  return { accessToken, refreshToken };
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}

// ============================================================
// FETCH WRAPPER
// ============================================================

import { logger } from './logger';

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const { accessToken } = getTokens();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }

  const method = options.method || 'GET';
  logger.info('API', `Request: ${method} ${endpoint}`, options.body ? { body: JSON.parse(options.body as string) } : undefined);

  try {
    const start = Date.now();
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
    const duration = Date.now() - start;

    const data = await response.json();
    
    if (response.ok) {
        logger.info('API', `Response: ${method} ${endpoint} ${response.status} (${duration}ms)`, { data });
    } else {
        logger.error('API', `Error: ${method} ${endpoint} ${response.status} (${duration}ms)`, { error: data, status: response.status });
    }

    return data;
  } catch (error) {
    logger.error('API', `Network Error: ${method} ${endpoint}`, error);
    return { success: false, error: 'Network error' };
  }
}

// ============================================================
// AUTH
// ============================================================

export async function signup(
  email: string,
  password: string,
  username: string,
  displayName?: string
): Promise<ApiResponse<{ message: string }>> {
  return apiFetch('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, username, displayName }),
  });
}

export async function login(
  email: string,
  password: string
): Promise<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>> {
  const result = await apiFetch<{ user: User; accessToken: string; refreshToken: string }>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }
  );

  if (result.success && result.data) {
    setTokens(result.data.accessToken, result.data.refreshToken);
  }

  return result;
}

export async function getPostByUsernameAndSlug(username: string, slug: string): Promise<Post | null> {
  // Username comes in as '%40username' or '@username' from the URL params
  // We need to ensure we send it correctly to the API
  const cleanUsername = username.startsWith('%40') ? username.replace('%40', '') : username.replace('@', '');
  
  const res = await apiFetch<Post>(`/posts/@${cleanUsername}/${slug}`, {
    next: { revalidate: 60 },
  });
  
  return res.success ? res.data || null : null;
}

export async function createPost(data: Partial<Post>): Promise<Post | null> {
  const result = await apiFetch<Post>('/admin/posts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.success ? result.data || null : null;
}

export async function logout(): Promise<void> {
  await apiFetch('/auth/logout', { method: 'POST' });
  clearTokens();
}

export async function getCurrentUser(): Promise<User | null> {
  const result = await apiFetch<User>('/auth/me');
  return result.success ? result.data || null : null;
}

// ============================================================
// POSTS (PUBLIC)
// ============================================================

export async function getPosts(
  page = 1,
  pageSize = 10
): Promise<PaginatedResponse<Post>> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  const result = await apiFetch<PaginatedResponse<Post>>(`/posts?${params}`);
  
  return result as unknown as PaginatedResponse<Post>;
}

export async function getStaffPicks(limit = 3): Promise<Post[]> {
  const result = await apiFetch<Post[]>(`/posts/staff-picks?limit=${limit}`);
  return result.success ? result.data || [] : [];
}

export async function getWhoToFollow(limit = 3): Promise<User[]> {
  const result = await apiFetch<User[]>(`/users/who-to-follow?limit=${limit}`);
  return result.success ? result.data || [] : [];
}

export async function getFollowing(page = 1, limit = 10): Promise<PaginatedResponse<User>> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  const result = await apiFetch<PaginatedResponse<User>>(`/users/following?${params}`);
  return result as unknown as PaginatedResponse<User>;
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const result = await apiFetch<Post>(`/posts/${slug}`);
  return result.success ? result.data || null : null;
}

export async function addClaps(
  postId: string,
  count = 1,
  sessionId?: string
): Promise<{ clap: unknown; totalClaps: number } | null> {
  const result = await apiFetch<{ clap: unknown; totalClaps: number }>(
    `/posts/${postId}/claps`,
    {
      method: 'POST',
      body: JSON.stringify({ count, sessionId }),
    }
  );
  return result.success ? result.data || null : null;
}

export async function getComments(postId: string): Promise<Comment[]> {
  const result = await apiFetch<Comment[]>(`/posts/${postId}/comments`);
  return result.success ? result.data || [] : [];
}

export async function addComment(
  postId: string,
  content: string,
  parentId?: string
): Promise<Comment | null> {
  const result = await apiFetch<Comment>(`/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content, parentId }),
  });
  return result.success ? result.data || null : null;
}

// ============================================================
// SESSION ID (for anonymous claps)
// ============================================================

export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
}

// ============================================================
// CONTENT RENDERING
// ============================================================

export function renderContent(blocks: ContentBlock[]): string {
  if (!blocks || !Array.isArray(blocks)) return '';

  return blocks.map((block) => {
    switch (block.type) {
      case 'paragraph':
        return `<p>${renderInline(block.content)}</p>`;
      case 'heading':
        const level = block.attrs?.level || 2;
        return `<h${level}>${renderInline(block.content)}</h${level}>`;
      case 'bulletList':
        return `<ul>${block.content?.map((li) => `<li>${renderContent(li.content || [])}</li>`).join('')}</ul>`;
      case 'orderedList':
        return `<ol>${block.content?.map((li) => `<li>${renderContent(li.content || [])}</li>`).join('')}</ol>`;
      case 'blockquote':
        return `<blockquote>${renderContent(block.content || [])}</blockquote>`;
      case 'codeBlock':
        return `<pre><code class="language-${block.attrs?.language || ''}">${renderInline(block.content)}</code></pre>`;
      case 'image':
        return `<figure><img src="${block.attrs?.src}" alt="${block.attrs?.alt || ''}" /><figcaption>${block.attrs?.title || ''}</figcaption></figure>`;
      case 'horizontalRule':
        return '<hr />';
      default:
        return renderInline(block.content);
    }
  }).join('');
}

function renderInline(content?: ContentBlock[]): string {
  if (!content) return '';
  
  return content.map((node) => {
    if (node.type === 'text') {
      let text = node.text || '';
      if (node.marks) {
        node.marks.forEach((mark) => {
          switch (mark.type) {
            case 'bold':
              text = `<strong>${text}</strong>`;
              break;
            case 'italic':
              text = `<em>${text}</em>`;
              break;
            case 'code':
              text = `<code>${text}</code>`;
              break;
            case 'link':
              text = `<a href="${mark.attrs?.href}" target="_blank" rel="noopener">${text}</a>`;
              break;
          }
        });
      }
      return text;
    }
    return '';
  }).join('');
}
