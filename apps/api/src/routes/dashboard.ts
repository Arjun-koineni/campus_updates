import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listPosts } from '../services/postService.js';
import { prisma } from '../lib/prisma.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const previousVisit = req.user!.lastVisitAt;
  const [posts, pending, categories] = await Promise.all([
    listPosts({ userId: req.user!.id }),
    prisma.registration.findMany({ where: { userId: req.user!.id, status: 'REMIND_LATER', post: { status: { not: 'ARCHIVED' } } }, include: { post: { include: { category: true } } }, orderBy: { remindAt: 'asc' }, take: 5 }),
    prisma.category.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } })
  ]);
  const since = typeof req.query.since === 'string' ? new Date(req.query.since) : previousVisit ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const fresh = posts.filter((post) => new Date(post.updatedAt) >= since).slice(0, 5);
  await prisma.user.update({ where: { id: req.user!.id }, data: { lastVisitAt: new Date() } });
  return res.json({
    pinned: posts.filter((post) => post.pinned && post.type === 'NOTICE').slice(0, 3),
    closingSoon: posts.filter((post) => post.type === 'DEADLINE' && post.deadlineAt && new Date(post.deadlineAt).getTime() - Date.now() <= 48 * 60 * 60 * 1000 && new Date(post.deadlineAt).getTime() > Date.now()).slice(0, 5),
    pending: pending.map((item) => ({ ...item.post, remindAt: item.remindAt?.toISOString() ?? null })),
    fresh,
    categories,
    generatedAt: new Date().toISOString()
  });
});

export default router;
