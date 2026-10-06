import { Router } from 'express';
import { CategoryType } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
const categoryInput = z.object({ name: z.string().trim().min(2).max(80), type: z.nativeEnum(CategoryType), sortOrder: z.number().int().optional() });

router.use(requireAuth);

router.get('/', async (_req, res) => {
  const categories = await prisma.category.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } });
  return res.json({ categories });
});

router.post('/', requireRole('ADMIN'), async (req, res) => {
  const input = categoryInput.parse(req.body);
  const category = await prisma.category.create({ data: { ...input, sortOrder: input.sortOrder ?? 0 } });
  return res.status(201).json({ category });
});

router.patch('/:id', requireRole('ADMIN'), async (req, res) => {
  const input = categoryInput.partial().parse(req.body);
  const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
  const category = await prisma.category.update({ where: { id }, data: input });
  return res.json({ category });
});

router.delete('/:id', requireRole('ADMIN'), async (req, res) => {
  const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
  await prisma.category.update({ where: { id }, data: { active: false } });
  return res.status(204).send();
});

export default router;
