import { supabaseAdmin } from '../config/supabase.js';
import type { Media, MediaFilterOptions, PaginatedMediaResponse } from '../types/media.js';

export async function createMedia(data: Partial<Media>): Promise<Media> {
  const { data: media, error } = await supabaseAdmin
    .from('media')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return media as Media;
}

export async function getMedia(options: MediaFilterOptions): Promise<PaginatedMediaResponse> {
  const { page = 1, pageSize = 20, tags, search } = options;
  const offset = (page - 1) * pageSize;

  let query = supabaseAdmin
    .from('media')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (tags && tags.length > 0) {
    query = query.contains('tags', tags);
  }

  if (search) {
    query = query.ilike('filename', `%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: (data || []) as Media[],
    meta: {
      page,
      pageSize,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
    },
  };
}

export async function updateMedia(id: string, updates: Partial<Media>): Promise<Media> {
  const { data, error } = await supabaseAdmin
    .from('media')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Media;
}

export async function deleteMedia(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('media')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getMediaById(id: string): Promise<Media | null> {
  const { data, error } = await supabaseAdmin
    .from('media')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as Media;
}
