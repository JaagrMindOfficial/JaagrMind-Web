import { supabaseAdmin } from '../config/supabase.js';
import type { Topic } from '../types/index.js';

export async function getTopics(): Promise<Topic[]> {
  const { data, error } = await supabaseAdmin
    .from('topics')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data as Topic[];
}

export async function getTopicBySlug(slug: string): Promise<Topic | null> {
  const { data, error } = await supabaseAdmin
    .from('topics')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) return null;
  return data as Topic;
}

export async function createTopic(
  name: string,
  slug: string,
  description?: string,
  coverUrl?: string
): Promise<Topic> {
  const { data, error } = await supabaseAdmin
    .from('topics')
    .insert({ name, slug, description, cover_url: coverUrl })
    .select()
    .single();

  if (error) throw error;
  return data as Topic;
}

export async function updateTopic(
  id: string,
  updates: Partial<Topic>
): Promise<Topic> {
  const { data, error } = await supabaseAdmin
    .from('topics')
    .update({
      name: updates.name,
      slug: updates.slug,
      description: updates.description,
      cover_url: updates.cover_url,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Topic;
}

export async function deleteTopic(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('topics')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Topic follows
export async function followTopic(userId: string, topicId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('topic_follows')
    .insert({ user_id: userId, topic_id: topicId });

  if (error) throw error;
}

export async function unfollowTopic(userId: string, topicId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('topic_follows')
    .delete()
    .eq('user_id', userId)
    .eq('topic_id', topicId);

  if (error) throw error;
}

export async function getUserFollowedTopics(userId: string): Promise<Topic[]> {
  const { data, error } = await supabaseAdmin
    .from('topic_follows')
    .select('topics(*)')
    .eq('user_id', userId);

  if (error) throw error;
  return data?.map((tf: { topics: unknown }) => tf.topics as Topic) || [];
}
