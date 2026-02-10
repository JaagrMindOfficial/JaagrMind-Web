import { supabaseAdmin } from '../config/supabase.js';
import type { Post, PostWithStats, PaginatedResponse } from '../types/index.js';

import { getTopicBySlug } from './topics.js';

export interface GetPostsOptions {
  page?: number;
  pageSize?: number;
  status?: string;
  authorId?: string;
  topicId?: string;
  topicSlug?: string;
  sortBy?: 'created_at' | 'updated_at' | 'view_count' | 'clap_count';
  sortDir?: 'asc' | 'desc';
  viewerId?: string;
}

export async function getPosts(
  options: GetPostsOptions = {}
): Promise<PaginatedResponse<PostWithStats>> {
  const { 
    page = 1, 
    pageSize = 10, 
    status, 
    authorId, 
    topicId, 
    topicSlug,
    sortBy = 'created_at',
    sortDir = 'desc',
    viewerId
  } = options;
  const offset = (page - 1) * pageSize;

  let query = supabaseAdmin
    .from('posts_with_stats') // Ensure using view for stats sorting
    .select('*, author:users!author_id(*, profiles(*)), post_topics(topics(*))', { count: 'exact' })
    .is('deleted_at', null)
    .range(offset, offset + pageSize - 1);
    
  // Apply sorting
  query = query.order(sortBy, { ascending: sortDir === 'asc' });

  // Filter by topic slug if provided

  // Filter by topic slug if provided
  if (topicSlug) {
    const topic = await getTopicBySlug(topicSlug);
    if (!topic) {
       return { data: [], meta: { page, pageSize, total: 0, totalPages: 0 } };
    }
    // We still need to filter by ID here because Supabase doesn't support deep filtering in the top-level query easily
    // But we can optimize this later. For now, keeping the logic but applying it to the optimized query.
    const { data: postTopics } = await supabaseAdmin
      .from('post_topics')
      .select('post_id')
      .eq('topic_id', topic.id);
      
    const postIds = postTopics?.map(pt => pt.post_id) || [];
    if (postIds.length === 0) return { data: [], meta: { page, pageSize, total: 0, totalPages: 0 } };
    
    query = query.in('id', postIds);
  } else if (topicId) {
     const { data: postTopics } = await supabaseAdmin
      .from('post_topics')
      .select('post_id')
      .eq('topic_id', topicId);
      
    const postIds = postTopics?.map(pt => pt.post_id) || [];
    if (postIds.length === 0) return { data: [], meta: { page, pageSize, total: 0, totalPages: 0 } };
    
    query = query.in('id', postIds);
  }

  // Only filter by status if explicitly provided
  if (status) {
    query = query.eq('status', status);
  }

  if (authorId) {
    query = query.eq('author_id', authorId);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  // Transform data to match PostWithStats interface
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const posts = (data || []).map((post: any) => ({
    ...post,
    // post_topics is returned due to the select statement, map it to topics array
    topics: post.post_topics?.map((pt: any) => pt.topics) || [],
    // removed internal join field
    post_topics: undefined,
  }));

  // Decorate with saved status if viewerId is provided
  if (viewerId && posts.length > 0) {
    console.log(`[PostsRepo] Checking saved status for viewer ${viewerId} on ${posts.length} posts`);
    const postIds = posts.map(p => p.id);
    const { data: savedPosts } = await supabaseAdmin
      .from('saved_posts')
      .select('post_id')
      .eq('user_id', viewerId)
      .in('post_id', postIds);
      
    const savedPostIds = new Set(savedPosts?.map(sp => sp.post_id) || []);
    
    posts.forEach(post => {
      post.is_saved = savedPostIds.has(post.id);
    });
  }

  return {
    data: posts as PostWithStats[],
    meta: {
      page,
      pageSize,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
    },
  };
}

export async function getStaffPicks(limit = 3, viewerId?: string): Promise<PostWithStats[]> {
  const { data, error } = await supabaseAdmin
    .from('posts_with_stats')
    .select('*, author:users!author_id(*, profiles(*)), post_topics(topics(*))')
    .eq('status', 'published')
    .eq('is_staff_pick', true)
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  // Transform data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const posts = (data || []).map((post: any) => ({
    ...post,
    topics: post.post_topics?.map((pt: any) => pt.topics) || [],
    post_topics: undefined,
  })) as PostWithStats[];

  // Decorate with saved status if viewerId is provided
  // Decorate with saved status if viewerId is provided
  if (viewerId && posts.length > 0) {
      const postIds = posts.map(p => p.id);
      const { data: savedPosts } = await supabaseAdmin
        .from('saved_posts')
        .select('post_id')
        .eq('user_id', viewerId)
        .in('post_id', postIds);
        
      const savedPostIds = new Set(savedPosts?.map(sp => sp.post_id) || []);
      
      posts.forEach(post => {
        post.is_saved = savedPostIds.has(post.id);
      });
  }
  
  return posts;
}

export async function getPostBySlug(slug: string, viewerId?: string): Promise<PostWithStats | null> {
  const { data, error } = await supabaseAdmin
    .from('posts_with_stats')
    .select('*, author:users!author_id(*, profiles(*)), post_topics(topics(*))')
    .eq('slug', slug)
    .eq('status', 'published')
    .is('deleted_at', null)
    .single();

  if (error || !data) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const post = data as any;
  
  return {
    ...post,
    topics: post.post_topics?.map((pt: any) => pt.topics) || [],
    post_topics: undefined,
  } as PostWithStats;

  if (viewerId && post) {
      const { data } = await supabaseAdmin
        .from('saved_posts')
        .select('id')
        .match({ user_id: viewerId, post_id: post.id })
        .maybeSingle();
      post.is_saved = !!data;
  }
  
  return post;
}

export async function getPostByUsernameAndSlug(username: string, slug: string, viewerId?: string): Promise<PostWithStats | null> {
  // 1. Resolve username to user_id
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('user_id')
    .eq('username', username)
    .single();

  if (!profile) return null;

  // 2. Fetch post by slug and author_id with nested relations
  const { data: postData, error } = await supabaseAdmin
    .from('posts_with_stats')
    .select('*, author:users!author_id(*, profiles(*)), post_topics(topics(*))')
    .eq('slug', slug)
    .eq('author_id', profile.user_id)
    .eq('status', 'published')
    .is('deleted_at', null)
    .single();

  if (error || !postData) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const post = postData as any;

  return {
    ...post,
    topics: post.post_topics?.map((pt: any) => pt.topics) || [],
    post_topics: undefined,
  } as PostWithStats;

  if (viewerId && post) {
      const { data } = await supabaseAdmin
        .from('saved_posts')
        .select('id')
        .match({ user_id: viewerId, post_id: post.id })
        .maybeSingle();
      post.is_saved = !!data;
  }
  
  return post;
}

export async function getPostById(id: string): Promise<Post | null> {
  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('*, author:users!author_id(*, profiles(*)), post_topics(topics(*))')
    .eq('id', id)
    .single();

  if (error) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const post = data as any;

  return {
    ...post,
    topics: post.post_topics?.map((pt: any) => pt.topics) || [],
    post_topics: undefined,
  } as Post;
}

import { calculateReadingTime, extractText, countWords, MAX_WORDS_PER_POST } from '../utils/readingTime.js';

// ... (imports)

export async function createPost(
  authorId: string,
  data: Partial<Post>
): Promise<Post> {
  const readingTime = data.content ? calculateReadingTime(data.content) : 1;

  // Validation: Word Count Limits
  if (data.content) {
    const text = extractText(data.content);
    const words = countWords(text);
    if (words > MAX_WORDS_PER_POST) {
      throw new Error(`Post exceeds maximum limit of ${MAX_WORDS_PER_POST} words.`);
    }
  }

  const { data: post, error } = await supabaseAdmin
    .from('posts')
    .insert({
      author_id: authorId,
      title: data.title,
      subtitle: data.subtitle,
      slug: data.slug,
      content: data.content || [],
      cover_url: data.cover_url,
      status: data.status || 'draft',
      publication_id: data.publication_id,
      reading_time: readingTime, // Auto-calculated
    })
    .select()
    .single();

  if (error) throw error;
  return post as Post;
}

export async function updatePost(
  id: string,
  data: Partial<Post>
): Promise<Post> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.subtitle !== undefined) updateData.subtitle = data.subtitle;
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.content !== undefined) {
    // Validation: Word Count Limits
    const text = extractText(data.content);
    const words = countWords(text);
    if (words > MAX_WORDS_PER_POST) {
      throw new Error(`Post exceeds maximum limit of ${MAX_WORDS_PER_POST} words.`);
    }

    updateData.content = data.content;
    updateData.reading_time = calculateReadingTime(data.content); // Recalculate on update
  }
  if (data.cover_url !== undefined) updateData.cover_url = data.cover_url;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.publication_id !== undefined) updateData.publication_id = data.publication_id;

  const { data: post, error } = await supabaseAdmin
    .from('posts')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return post as Post;
}

export async function publishPost(id: string): Promise<Post> {
  const { data: post, error } = await supabaseAdmin
    .from('posts')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return post as Post;
}

export async function deletePost(id: string): Promise<void> {
  // Soft delete
  const { error } = await supabaseAdmin
    .from('posts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function setPostTopics(postId: string, topicIds: string[]): Promise<void> {
  // Clear existing
  await supabaseAdmin
    .from('post_topics')
    .delete()
    .eq('post_id', postId);

  // Add new
  if (topicIds.length > 0) {
    const { error } = await supabaseAdmin
      .from('post_topics')
      .insert(topicIds.map((topicId) => ({ post_id: postId, topic_id: topicId })));

    if (error) throw error;
  }
}
