import { Router, Request, Response } from 'express';
import { publicationsRepository } from '../repositories/publications.js';
import { authenticate, requireAuth } from '../middleware/auth.js';

const router = Router();

// Get all publications (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const publications = await publicationsRepository.getAll(page, limit);
    res.json(publications);
  } catch (error) {
    console.error('Get publications error:', error);
    res.status(500).json({ message: 'Failed to get publications' });
  }
});

// Get publication by slug (public)
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const publication = await publicationsRepository.getBySlug(slug);

    if (!publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    res.json({ data: publication });
  } catch (error) {
    console.error('Get publication error:', error);
    res.status(500).json({ message: 'Failed to get publication' });
  }
});

// Get publication posts (public)
router.get('/:slug/posts', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const publication = await publicationsRepository.getBySlug(slug);
    if (!publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    const posts = await publicationsRepository.getPublicationPosts(publication.id, page, limit);
    res.json(posts);
  } catch (error) {
    console.error('Get publication posts error:', error);
    res.status(500).json({ message: 'Failed to get posts' });
  }
});

// Get publication members (public)
router.get('/:slug/members', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const publication = await publicationsRepository.getBySlug(slug);

    if (!publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    const members = await publicationsRepository.getMembers(publication.id);
    res.json({ data: members });
  } catch (error) {
    console.error('Get publication members error:', error);
    res.status(500).json({ message: 'Failed to get members' });
  }
});

// Create publication (authenticated)
router.post('/', authenticate, requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, slug, description, logo_url, cover_url } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ message: 'Name and slug are required' });
    }

    // Check if slug is taken
    const existing = await publicationsRepository.getBySlug(slug);
    if (existing) {
      return res.status(400).json({ message: 'Slug is already taken' });
    }

    const publication = await publicationsRepository.create({
      name,
      slug,
      description,
      logo_url,
      cover_url,
      owner_id: userId,
    });

    // Add owner as admin member
    await publicationsRepository.addMember(publication.id, userId, 'admin');

    res.status(201).json({ data: publication });
  } catch (error) {
    console.error('Create publication error:', error);
    res.status(500).json({ message: 'Failed to create publication' });
  }
});

// Update publication (owner only)
router.put('/:id', authenticate, requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { name, description, logo_url, cover_url } = req.body;

    const publication = await publicationsRepository.getById(id);
    if (!publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    if (publication.owner_id !== userId) {
      return res.status(403).json({ message: 'Only the owner can update the publication' });
    }

    const updated = await publicationsRepository.update(id, {
      name,
      description,
      logo_url,
      cover_url,
    });

    res.json({ data: updated });
  } catch (error) {
    console.error('Update publication error:', error);
    res.status(500).json({ message: 'Failed to update publication' });
  }
});

// Delete publication (owner only)
router.delete('/:id', authenticate, requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const publication = await publicationsRepository.getById(id);
    if (!publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    if (publication.owner_id !== userId) {
      return res.status(403).json({ message: 'Only the owner can delete the publication' });
    }

    await publicationsRepository.delete(id);
    res.json({ message: 'Publication deleted' });
  } catch (error) {
    console.error('Delete publication error:', error);
    res.status(500).json({ message: 'Failed to delete publication' });
  }
});

// Add member to publication (owner/admin only)
router.post('/:id/members', authenticate, requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { user_id, role } = req.body;

    const publication = await publicationsRepository.getById(id);
    if (!publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    // Check if user is owner or admin
    const members = await publicationsRepository.getMembers(id);
    const currentMember = members.find((m: any) => m.user?.user_id === userId);
    
    if (publication.owner_id !== userId && currentMember?.role !== 'admin') {
      return res.status(403).json({ message: 'Only owner or admin can add members' });
    }

    await publicationsRepository.addMember(id, user_id, role || 'writer');
    res.json({ message: 'Member added' });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Failed to add member' });
  }
});

// Remove member from publication (owner/admin only)
router.delete('/:id/members/:memberId', authenticate, requireAuth, async (req: Request, res: Response) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.user!.id;

    const publication = await publicationsRepository.getById(id);
    if (!publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    // Check if user is owner or admin
    const members = await publicationsRepository.getMembers(id);
    const currentMember = members.find((m: any) => m.user?.user_id === userId);
    
    if (publication.owner_id !== userId && currentMember?.role !== 'admin') {
      return res.status(403).json({ message: 'Only owner or admin can remove members' });
    }

    await publicationsRepository.removeMember(id, memberId);
    res.json({ message: 'Member removed' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Failed to remove member' });
  }
});

export default router;
