import { supabase } from '../config/supabase.js';

export interface Publication {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export const publicationsRepository = {
  async getAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('publications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
    };
  },

  async getById(id: string): Promise<Publication | null> {
    const { data, error } = await supabase
      .from('publications')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  },

  async getBySlug(slug: string): Promise<Publication | null> {
    const { data, error } = await supabase
      .from('publications')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) return null;
    return data;
  },

  async create(publication: Partial<Publication>): Promise<Publication> {
    const { data, error } = await supabase
      .from('publications')
      .insert(publication)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Publication>): Promise<Publication> {
    const { data, error } = await supabase
      .from('publications')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('publications')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getMembers(publicationId: string) {
    const { data, error } = await supabase
      .from('publication_members')
      .select(`
        role,
        user:profiles!publication_members_user_id_fkey(*)
      `)
      .eq('publication_id', publicationId);

    if (error) throw error;
    return data || [];
  },

  async addMember(publicationId: string, userId: string, role = 'writer'): Promise<void> {
    const { error } = await supabase
      .from('publication_members')
      .insert({
        publication_id: publicationId,
        user_id: userId,
        role,
      });

    if (error && !error.message.includes('duplicate')) throw error;
  },

  async removeMember(publicationId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('publication_members')
      .delete()
      .eq('publication_id', publicationId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async updateMemberRole(publicationId: string, userId: string, role: string): Promise<void> {
    const { error } = await supabase
      .from('publication_members')
      .update({ role })
      .eq('publication_id', publicationId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async getUserPublications(userId: string) {
    const { data, error } = await supabase
      .from('publication_members')
      .select(`
        role,
        publication:publications(*)
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return data?.map(d => ({ ...d.publication, role: d.role })) || [];
  },

  async getPublicationPosts(publicationId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('publication_id', publicationId)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
    };
  },
};
