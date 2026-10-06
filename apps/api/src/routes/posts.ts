import { Router } from 'express';
import { AudienceType, PostStatus, PostType, Priority } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { createPost, listPosts, updatePost } from '../services/postService.js';
import multer from 'multer';
import { uploadPdf } from '../lib/storage.js';

const router = Router();
const pdfUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 }, fileFilter: (_req, file, callback) => callback(null, file.mimetype === 'application/pdf') });
const dateField = z.preprocess((value) => value === '' || value === null ? undefined : value, z.coerce.date().optional());
const postInput = z.object({
  categoryId: z.string().uuid(), type: z.nativeEnum(PostType), title: z.string().trim().min(3).max(180), summary: z.string().trim().min(3),
  source: z.string().trim().max(240).optional(), link: z.string().url().optional().or(z.literal('')), attachmentUrl: z.string().url().optional().or(z.literal('')), fees: z.string().trim().max(100).optional(),
  deadlineAt: dateField, validUntil: dateField, pinned: z.boolean().optional(), priority: z.nativeEnum(Priority).optional(),
  audienceType: z.nativeEnum(AudienceType).optional(), audienceValue: z.string().trim().max(100).optional()
});

router.use(requireAuth);

router.get('/', async (req, res) => {
  const posts = await listPosts({ userId: req.user!.id, categoryId: typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined, q: typeof req.query.q === 'string' ? req.query.q : undefined, past: req.query.past === 'true', admin: req.user!.role === 'ADMIN' && req.query.admin === 'true' });
  return res.json({ posts });
});

router.get('/:id', async (req, res) => {
  const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
  const post = await prisma.post.findUnique({ where: { id }, include: { category: true } });
  if (!post) return res.status(404).json({ error: 'Post not found' });
  return res.json({ post });
});

router.post('/', requireRole('ADMIN'), async (req, res) => {
  const input = postInput.parse(req.body);
  const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
  if (!category || !category.active) return res.status(400).json({ error: 'Category is unavailable' });
  if ((category.type === 'DEADLINE') !== (input.type === 'DEADLINE')) return res.status(400).json({ error: 'Post type must match category type' });
  if (input.type === 'DEADLINE' && !input.deadlineAt) return res.status(400).json({ error: 'Deadline posts require a deadline' });
  if (input.type === 'NOTICE' && input.deadlineAt) return res.status(400).json({ error: 'Notice posts cannot have a deadline' });
  const post = await createPost({
    category: { connect: { id: input.categoryId } }, type: input.type, title: input.title, summary: input.summary,
    source: input.source || null, link: input.link || null, attachmentUrl: input.attachmentUrl || null, fees: input.fees || null, deadlineAt: input.deadlineAt, validUntil: input.validUntil,
    pinned: input.pinned ?? false, priority: input.priority ?? Priority.NORMAL, audienceType: input.audienceType ?? AudienceType.ALL,
    audienceValue: input.audienceValue || null, createdBy: { connect: { id: req.user!.id } }
  }, req.user!.id);
  return res.status(201).json({ post });
});

router.post('/:id/pdf', requireRole('ADMIN'), pdfUpload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'PDF file is required' });
  const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
  const attachmentUrl = await uploadPdf(id, req.file);
  const post = await prisma.post.update({ where: { id }, data: { attachmentUrl, updatedBy: { connect: { id: req.user!.id } } } });
  return res.json({ attachmentUrl, post });
});

router.patch('/:id', requireRole('ADMIN'), async (req, res) => {
  const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
  const input = postInput.partial().parse(req.body);
  const data: any = { ...input };
  delete data.categoryId;
  if (input.categoryId) data.category = { connect: { id: input.categoryId } };
  if (input.link === '') data.link = null;
  if (input.attachmentUrl === '') data.attachmentUrl = null;
  if (input.source === '') data.source = null;
  if (input.fees === '') data.fees = null;
  data.updatedBy = { connect: { id: req.user!.id } };
  if (input.deadlineAt && input.deadlineAt > new Date()) data.status = PostStatus.ACTIVE;
  const post = await updatePost(id, data, req.user!.id);
  return res.json({ post });
});

router.post('/:id/archive', requireRole('ADMIN'), async (req, res) => {
  const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
  const post = await prisma.post.update({ where: { id }, data: { status: PostStatus.ARCHIVED, archivedAt: new Date(), updatedBy: { connect: { id: req.user!.id } } } });
  return res.json({ post });
});

export default router;
